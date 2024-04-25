import { replaceImageSize } from "@utils/Image";
import type {
  TwitchTokenResponse,
  TwitchBroadcasterResponse,
  TwitchScheduleResponse,
  TwitchCategoriesResponse,
  Category,
} from "../types/twitchTypes";

/**
 * Fetches a Twitch OAuth token.
 * @returns {Promise<string>} A promise that resolves with the OAuth token.
 */
const fetchTwitchToken = async (): Promise<string> => {
  const params = new URLSearchParams({
    grant_type: import.meta.env.TWITCH_GRANT_TYPE,
    client_id: import.meta.env.TWITCH_CLIENT_ID,
    client_secret: import.meta.env.TWITCH_CLIENT_SECRET,
  });

  const response = await fetch(import.meta.env.TWITCH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!response.ok) {
    throw new Error(`Error fetching access token: ${response.statusText}`);
  }

  const data: TwitchTokenResponse = await response.json();
  return data.access_token;
};

/**
 * Generates authorization headers using a fetched Twitch token.
 * @returns {Promise<HeadersInit>} Headers including authorization and client ID.
 */
const getAuthHeaders = async (): Promise<HeadersInit> => {
  const accessToken = await fetchTwitchToken();
  return {
    Authorization: `Bearer ${accessToken}`,
    "Client-Id": import.meta.env.TWITCH_CLIENT_ID,
  };
};

/**
 * Fetches the broadcaster ID for a given Twitch channel name.
 * @param channelName The Twitch channel name.
 * @returns {Promise<string | null>} A promise that resolves to the broadcaster ID or null.
 */
export const getBroadcasterIdByName = async (
  channelName: string
): Promise<string | null> => {
  const headers = await getAuthHeaders();
  const response = await fetch(
    `https://api.twitch.tv/helix/users?login=${channelName}`,
    { headers }
  );
  if (!response.ok) {
    throw new Error(`Error fetching broadcaster info: ${response.statusText}`);
  }

  const data: TwitchBroadcasterResponse = await response.json();
  return data.data.length > 0 ? data.data[0].id : null;
};

/**
 * Fetches the streaming schedule for a given Twitch broadcaster.
 * @param broadcasterId The broadcaster ID whose schedule is to be fetched.
 * @returns {Promise<TwitchScheduleResponse>} A promise that resolves to the schedule data.
 */
export const getTwitchSchedule = async (
  broadcasterId: string
): Promise<TwitchScheduleResponse> => {
  const headers = await getAuthHeaders();
  const response = await fetch(
    `https://api.twitch.tv/helix/schedule?broadcaster_id=${broadcasterId}`,
    { headers }
  );
  if (!response.ok) {
    throw new Error(`Error fetching schedule: ${response.statusText}`);
  }

  return await response.json();
};

/**
 * Fetches information about specified Twitch categories and adjusts the size of their box art images.
 * This function makes an API call to Twitch's `helix/games` endpoint to retrieve information about the given categories.
 * It then processes the response to replace the `{width}` and `{height}` placeholders in the box art URL with the specified values.
 *
 * @param {string[]} categoriesIds - An array of category IDs for which information is to be fetched.
 * @param {number} width - The desired width for the box art images.
 * @param {number} height - The desired height for the box art images.
 * @returns {Promise<Category[]>} A promise that resolves to an array of category objects with the box art URLs adjusted to the specified size.
 *
 * Each object in the returned array represents a category, including all original information plus the modified box art URL.
 */
export const getTwitchCategories = async (
  categoriesIds: string[],
  width: number,
  height: number
): Promise<TwitchCategoriesResponse> => {
  const headers = await getAuthHeaders();
  const params = new URLSearchParams();
  categoriesIds.forEach((id) => params.append("id", id));

  const response = await fetch(`https://api.twitch.tv/helix/games?${params}`, {
    headers,
  });
  if (!response.ok) {
    throw new Error(`Error fetching categories: ${response.statusText}`);
  }

  const categories = await response.json();

  const processedCategories = categories.data.map((category: Category) => ({
    ...category,
    box_art_url: replaceImageSize(category.box_art_url, width, height),
  }));

  return { data: processedCategories };
};
