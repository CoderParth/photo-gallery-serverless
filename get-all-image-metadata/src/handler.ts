import { APIGatewayProxyResult } from "aws-lambda";
import { DynamoDB } from "aws-sdk";

const dynamoDb = new DynamoDB.DocumentClient();

// Get all metadata for all the images
export async function getAllImageMetadata(): Promise<APIGatewayProxyResult> {
  const params = {
    TableName: "ImageMetadata",
  };

  try {
    const result = await dynamoDb.scan(params).promise();

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify({
        message: "All image metadata retrieved successfully",
        metadata: result.Items,
      }),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify({
        message: "An error occurred while retrieving all image metadata",
      }),
    };
  }
}
