/**
 * Replaces the size placeholders in the image URL with the specified values.
 * @param {string} imageUrl - The image URL with placeholders for width and height.
 * @param {number} width - The desired width for the image.
 * @param {number} height - The desired height for the image.
 * @returns {string} The image URL with the specified sizes.
 */
export const replaceImageSize = (
  imageUrl: string,
  width: number,
  height: number
) =>
  imageUrl
    .replace("{width}", width.toString())
    .replace("{height}", height.toString());
