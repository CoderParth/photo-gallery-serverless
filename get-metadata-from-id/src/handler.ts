import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDB } from "aws-sdk";

const dynamoDb = new DynamoDB.DocumentClient();

async function fetchImageMetadata(imageId: string) {
  const params = {
    TableName: "ImageMetadata",
    Key: {
      ImageID: imageId,
    },
  };

  const result = await dynamoDb.get(params).promise();
  return result.Item;
}

export async function getHandler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const id = event.pathParameters && event.pathParameters["id"];

    if (!id) {
      return {
        statusCode: 400,
        body: "Missing ImageID",
      };
    }

    const metadata = await fetchImageMetadata(id);

    if (!metadata) {
      return {
        statusCode: 404,
        body: "Image metadata not found",
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(metadata),
    };
  } catch (error) {
    console.error(error as Error);
    return {
      statusCode: 500,
      body: `Something went wrong. Error: ${(error as Error).message}`,
    };
  }
}
