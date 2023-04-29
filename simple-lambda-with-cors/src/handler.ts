import { APIGatewayProxyHandler } from "aws-lambda";

export const handler: APIGatewayProxyHandler = async (event, context) => {
  const response = {
    statusCode: 200,
    body: JSON.stringify({ message: "Hello, World!" }),
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": true,
    },
  };

  return response;
};
