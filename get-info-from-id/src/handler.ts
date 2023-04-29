import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import * as ServerlessMysql from "serverless-mysql";

const db = ServerlessMysql({
  config: {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  },
});

// SQL QUERY for image_info table
// CREATE TABLE image_info (
//     id INT AUTO_INCREMENT PRIMARY KEY,
//     username VARCHAR(255) NOT NULL,
//     image_url VARCHAR(1000) NOT NULL,
//     description TEXT NOT NULL,
//     tags TEXT NOT NULL
//   );

const queryDatabase = async (query: string, values?: any[]): Promise<any> => {
  try {
    const results = await db.query(query, values);
    await db.end();
    return results;
  } catch (error) {
    await db.end();
    throw error;
  }
};

// Get image info
export const getImageInfo = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const { id } = event.pathParameters || {};

  if (!id) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "Invalid request: Image ID is required",
      }),
    };
  }

  try {
    const results = await queryDatabase(
      "SELECT * FROM image_info WHERE image_id = ?",
      [id]
    );

    if (results.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          message: "Image info not found",
        }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Image info retrieved successfully",
        imageInfo: results[0],
      }),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "An error occurred while retrieving image info",
      }),
    };
  }
};
