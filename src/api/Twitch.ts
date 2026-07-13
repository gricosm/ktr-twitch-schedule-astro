import { TWITCH_CLIENT_ID, TWITCH_CLIENT_SECRET } from "astro:env/server";
import { replaceImageSize } from "@utils/Image";
import type {
  TwitchTokenResponse,
  TwitchBroadcasterResponse,
  TwitchScheduleResponse,
  TwitchCategoriesResponse,
  Category,
} from "../types/twitchTypes";

const TOKEN_URL = "https://id.twitch.tv/oauth2/token";
const HELIX_URL = "https://api.twitch.tv/helix";

/** Safety margin: renew the token 60s before it actually expires. */
const EXPIRY_MARGIN_MS = 60_000;

interface CachedToken {
  accessToken: string;
  expiresAt: number;
}

/**
 * In-memory token cache. It lives as long as the serverless instance does
 * (on Vercel, across "warm" invocations). It is not persistent, and it does
 * not need to be: worst case, we request a new token.
 */
let cachedToken: CachedToken | null = null;

/** In-flight token request, so N concurrent callers don't request N tokens. */
let inFlight: Promise<string> | null = null;

const isValid = (token: CachedToken | null): token is CachedToken =>
  token !== null && Date.now() < token.expiresAt - EXPIRY_MARGIN_MS;

/**
 * Requests a fresh token from Twitch (client credentials flow).
 * @returns {Promise<string>} The access token.
 */
const requestNewToken = async (): Promise<string> => {
  const params = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: TWITCH_CLIENT_ID,
    client_secret: TWITCH_CLIENT_SECRET,
  });

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!response.ok) {
    throw new Error(`Error fetching access token: ${response.statusText}`);
  }

  const data: TwitchTokenResponse = await response.json();

  cachedToken = {
    accessToken: data.access_token,
    // expires_in is returned in seconds.
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return data.access_token;
};

/**
 * Returns a valid token, reusing the cached one while it is still good.
 * @param force Bypass the cache and force a new token (used to retry after a 401).
 * @returns {Promise<string>} A valid access token.
 */
const getAccessToken = async (force = false): Promise<string> => {
  if (!force && isValid(cachedToken)) {
    return cachedToken.accessToken;
  }

  // If a request is already running, piggyback on it.
  if (!force && inFlight) {
    return inFlight;
  }

  inFlight = requestNewToken().finally(() => {
    inFlight = null;
  });

  return inFlight;
};

/**
 * Calls the Helix API using the cached token.
 * If Twitch replies with a 401 (token revoked or expired early), it requests a
 * new token and retries exactly once.
 * @param path Helix-relative path, e.g. "/users?login=foo".
 * @returns {Promise<Response>} The raw Helix response.
 */
const helixFetch = async (path: string): Promise<Response> => {
  const call = async (token: string) =>
    fetch(`${HELIX_URL}${path}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Client-Id": TWITCH_CLIENT_ID,
      },
    });

  let response = await call(await getAccessToken());

  if (response.status === 401) {
    cachedToken = null;
    response = await call(await getAccessToken(true));
  }

  return response;
};

/**
 * Fetches the broadcaster ID for a given Twitch channel name.
 * @param channelName The Twitch channel name.
 * @returns {Promise<string | null>} A promise that resolves to the broadcaster ID or null.
 */
export const getBroadcasterIdByName = async (
  channelName: string
): Promise<string | null> => {
  const response = await helixFetch(
    `/users?login=${encodeURIComponent(channelName)}`
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
  const response = await helixFetch(`/schedule?broadcaster_id=${broadcasterId}`);

  if (!response.ok) {
    throw new Error(`Error fetching schedule: ${response.statusText}`);
  }

  return await response.json();
};

/**
 * Fetches information about the given Twitch categories and resizes their box
 * art images by replacing the {width} and {height} placeholders in the URL.
 *
 * @param categoriesIds Category IDs to fetch.
 * @param width Desired box art width.
 * @param height Desired box art height.
 * @returns {Promise<TwitchCategoriesResponse>} Categories with resized box art URLs.
 */
export const getTwitchCategories = async (
  categoriesIds: string[],
  width: number,
  height: number
): Promise<TwitchCategoriesResponse> => {
  // Helix returns a 400 when no id is supplied, so bail out before spending the call.
  if (categoriesIds.length === 0) {
    return { data: [] };
  }

  const params = new URLSearchParams();
  // Twitch accepts at most 100 ids per request, and duplicates count towards it.
  [...new Set(categoriesIds)].slice(0, 100).forEach((id) => {
    params.append("id", id);
  });

  const response = await helixFetch(`/games?${params}`);

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