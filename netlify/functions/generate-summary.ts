import { Handler } from '@netlify/functions';

export const handler: Handler = async () => {
  return {
    statusCode: 410, // 410 Gone
    body: JSON.stringify({ error: 'This API endpoint is no longer supported. Plan summary generation is now handled client-side.' }),
  };
};
