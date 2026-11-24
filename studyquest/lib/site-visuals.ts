export const visualPath = (area: string, id: string) => `/visuals/${area}/${id}`;

const letters = /\p{L}/u;
const sticker =
  /^(?=.*[\p{Extended_Pictographic}\p{Regional_Indicator}])[\p{Extended_Pictographic}\p{Regional_Indicator}\p{Emoji_Modifier}\u200d\ufe0f\s]+$/u;

export const editableSiteText = (text: string) => letters.test(text) || sticker.test(text);
