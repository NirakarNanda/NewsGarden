export interface ApprovalEmail {

  to: string;

  editionTitle: string;

  editionId: string;

  articleCount: number;

  reviewUrl?: string;
}

interface SmtpConfig {

  host: string;

  port: number;

  user?: string;

  pass?: string;

  from: string;
}

/*
 * Sends the "edition ready for approval"
 * notification.
 *
 * nodemailer is NOT in package.json, so
 * this ships with a console fallback only:
 * if SMTP env is set AND nodemailer can
 * be dynamically imported, a real email
 * goes out; otherwise the notification is
 * logged to the console.
 *
 * Env (optional):
 *   SMTP_HOST, SMTP_PORT,
 *   SMTP_USER, SMTP_PASS, SMTP_FROM
 */
export class EmailService {

  async sendApprovalNotification(
    email: ApprovalEmail
  ): Promise<{
    sent: boolean;
    via: "smtp" | "console";
  }> {

    const config =
      this.smtpConfig();

    if (config) {

      const sent =
        await this.sendViaSmtp(
          config,
          email
        );

      if (sent) {

        return {
          sent: true,
          via: "smtp",
        };
      }
    }

    this.logToConsole(email);

    return {
      sent: false,
      via: "console",
    };
  }

  private smtpConfig(): SmtpConfig | null {

    const host =
      process.env.SMTP_HOST;

    if (!host) {

      return null;
    }

    return {

      host,

      port: Number(
        process.env.SMTP_PORT
      ) || 587,

      user:
        process.env.SMTP_USER,

      pass:
        process.env.SMTP_PASS,

      from:
        process.env.SMTP_FROM ??
        "newsgarden@localhost",
    };
  }

  private async sendViaSmtp(
    config: SmtpConfig,
    email: ApprovalEmail
  ): Promise<boolean> {

    try {

      // nodemailer is an optional peer:
      // keep the specifier in a variable
      // so TS does not try to resolve it.
      const specifier =
        "nodemailer";

      const nodemailer =
        (await import(
          specifier
        )) as unknown as {
          createTransport: (
            opts: unknown
          ) => {
            sendMail: (
              msg: unknown
            ) => Promise<unknown>;
          };
        };

      const transporter =
        nodemailer.createTransport({

          host: config.host,

          port: config.port,

          secure:
            config.port === 465,

          auth:
            config.user &&
            config.pass
              ? {
                  user: config.user,
                  pass: config.pass,
                }
              : undefined,
        });

      await transporter.sendMail({

        from: config.from,

        to: email.to,

        subject: `📰 Ready for approval: ${email.editionTitle}`,

        text: this.renderText(
          email
        ),
      });

      console.log(
        `[EmailService] Approval email sent to ${email.to}`
      );

      return true;

    } catch (error) {

      console.warn(
        "[EmailService] SMTP send failed, falling back to console:",

        error instanceof Error
          ? error.message
          : error
      );

      return false;
    }
  }

  private renderText(
    email: ApprovalEmail
  ): string {

    const lines = [
      `The edition "${email.editionTitle}" is ready for your approval.`,
      "",
      `Edition ID: ${email.editionId}`,
      `Articles: ${email.articleCount}`,
    ];

    if (email.reviewUrl) {

      lines.push(
        "",
        `Review it here: ${email.reviewUrl}`
      );
    }

    lines.push(
      "",
      "No article will be published until you approve."
    );

    return lines.join("\n");
  }

  private logToConsole(
    email: ApprovalEmail
  ): void {

    console.log(
      [
        "",
        "==================================================",
        "📧 APPROVAL NOTIFICATION — email not configured,",
        "   showing here instead of sending.",
        "   (Set SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS/SMTP_FROM",
        "    and install nodemailer to send real email.)",
        `To: ${email.to}`,
        `Edition: ${email.editionTitle}`,
        `Edition ID: ${email.editionId}`,
        `Articles: ${email.articleCount}`,
        email.reviewUrl
          ? `Review: ${email.reviewUrl}`
          : "Review: (no review URL configured)",
        "==================================================",
        "",
      ].join("\n")
    );
  }
}
