"use client";

import { createUsePuck } from "@puckeditor/core";

/** Hook tipado com seletor — evita re-renders e o warning do Puck. */
export const useStudioPuck = createUsePuck();
