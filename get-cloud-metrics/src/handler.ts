import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { LambdaClient, ListFunctionsCommand } from "@aws-sdk/client-lambda";
import {
  CloudWatchClient,
  GetMetricDataCommand,
} from "@aws-sdk/client-cloudwatch";

const lambda = new LambdaClient({ region: "ap-southeast-2" });
const cloudwatch = new CloudWatchClient({ region: "ap-southeast-2" });

export const getMetrics = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    console.log("Fetching list of functions...");
    const listFunctions = new ListFunctionsCommand({});
    const listFunctionsResponse = await lambda.send(listFunctions);
    console.log(`Found ${listFunctionsResponse.Functions?.length} functions.`);

    const metrics: { [key: string]: { invocations: number; errors: number } } =
      {};

    if (listFunctionsResponse.Functions) {
      for (const lambdaFunction of listFunctionsResponse.Functions) {
        console.log(
          `Getting metrics for function ${lambdaFunction.FunctionName}...`
        );

        const currentTime = new Date();
        const twoHoursAgo = new Date(
          currentTime.getTime() - 2 * 60 * 60 * 1000
        );

        const getMetricData = new GetMetricDataCommand({
          MetricDataQueries: [
            {
              Id: "invocations",
              MetricStat: {
                Metric: {
                  Namespace: "AWS/Lambda",
                  MetricName: "Invocations",
                  Dimensions: [
                    {
                      Name: "FunctionName",
                      Value: lambdaFunction.FunctionName,
                    },
                  ],
                },
                Period: 60,
                Stat: "Sum",
              },
              ReturnData: true,
            },
            {
              Id: "errors",
              MetricStat: {
                Metric: {
                  Namespace: "AWS/Lambda",
                  MetricName: "Errors",
                  Dimensions: [
                    {
                      Name: "FunctionName",
                      Value: lambdaFunction.FunctionName,
                    },
                  ],
                },
                Period: 60,
                Stat: "Sum",
              },
              ReturnData: true,
            },
          ],
          StartTime: twoHoursAgo,
          EndTime: currentTime,
        });

        try {
          const metricData = await cloudwatch.send(getMetricData);
          console.log(
            `Found ${metricData?.MetricDataResults?.length} metric data results for function ${lambdaFunction.FunctionName}.`
          );

          const invocations =
            metricData.MetricDataResults?.find(
              (result) => result.Id === "invocations"
            )?.Values?.reduce((total, value) => total + value, 0) || 0;
          const errors =
            metricData.MetricDataResults?.find(
              (result) => result.Id === "errors"
            )?.Values?.reduce((total, value) => total + value, 0) || 0;

          metrics[lambdaFunction.FunctionName as string] = {
            invocations,
            errors,
          };
        } catch (error) {
          console.log(
            `Error getting metrics for function ${lambdaFunction.FunctionName}:`,
            error
          );
        }
      }
    }

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify(metrics),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify({ message: "An error occurred" }),
    };
  }
};
