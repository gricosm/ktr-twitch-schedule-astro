import {
  getBroadcasterIdByName,
  getTwitchSchedule,
  getTwitchCategories,
} from "../../api/Twitch";
import type {
  TwitchScheduleResponse,
  TwitchCategoriesResponse,
  Category,
  ScheduleData,
} from "../../types/twitchTypes";

/**
 * Fetches Twitch broadcaster schedule and related categories.
 * @returns {Promise<Response>} A promise that resolves to a Response object containing the broadcaster schedule and categories.
 */
export async function GET(): Promise<Response> {
  try {
    const broadcasterId = await getBroadcasterIdByName("killthatrobot");
    if (!broadcasterId) {
      return new Response(JSON.stringify({ error: "No broadcaster found" }), {
        status: 404,
      });
    }

    let schedule: ScheduleData | null = null;
    let categories: Category[] | null = null;

    try {
      const scheduleResponse: TwitchScheduleResponse = await getTwitchSchedule(
        broadcasterId
      );

      if (scheduleResponse.data) {
        schedule = scheduleResponse.data;

        const categoryIds = schedule.segments.map(
          (segment) => segment.category.id
        );
        const categoriesResponse: TwitchCategoriesResponse =
          await getTwitchCategories(categoryIds, 432, 650);

        if (categoriesResponse && categoriesResponse.data) {
          categories = categoriesResponse.data;
        }
      }
    } catch (error) {
      console.error("Error fetching Twitch schedule or categories:", error);
    }

    const data = {
      broadcasterId,
      schedule,
      categories,
    };

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
      });
    } else {
      return new Response(JSON.stringify({ error: "Unknown error occurred" }), {
        status: 500,
      });
    }
  }
}
