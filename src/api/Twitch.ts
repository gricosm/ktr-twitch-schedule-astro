import type {
  TwitchGamesResponse,
  TwitchTokenResponse,
  TwitchBroadcasterResponse,
  TwitchScheduleResponse,
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
 * Fetches information about one or more games from the Twitch API.
 * @param gameIds An array of game IDs to fetch information for.
 * @returns {Promise<TwitchGamesResponse>} A promise that resolves to the games information.
 */
export const getTwitchGames = async (
  gameIds: string[]
): Promise<TwitchGamesResponse> => {
  const headers = await getAuthHeaders();
  const params = new URLSearchParams();
  gameIds.forEach((id) => params.append("id", id));

  const response = await fetch(`https://api.twitch.tv/helix/games?${params}`, {
    headers,
  });
  if (!response.ok) {
    throw new Error(`Error fetching games: ${response.statusText}`);
  }

  return await response.json();
};
