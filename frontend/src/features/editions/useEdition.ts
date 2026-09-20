"use client";

import { useLive } from "@/lib/useLive";
import { MOCK_EDITION } from "@/features/mock";
import { fetchLatestEdition } from "./editionApi";

export const useEdition = () => useLive(fetchLatestEdition, MOCK_EDITION, 5000);
