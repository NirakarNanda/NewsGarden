export interface NewsEvent {
  eventId: string;

  // The article that originally created the event.
  representativeArticleId: string;

  // Short description of the event.
  title: string;

  category: string;

  // Articles covering this event.
  articleIds: string[];

  // Useful for finding candidate matches.
  keywords: string[];

  createdAt: Date;

  updatedAt: Date;
}