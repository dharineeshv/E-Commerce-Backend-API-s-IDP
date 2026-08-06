const { DynamoDBClient, ScanCommand, UpdateItemCommand } = require("@aws-sdk/client-dynamodb");
const client = new DynamoDBClient({ region: "ap-southeast-1" });

async function fix() {
    const scanCmd = new ScanCommand({ TableName: "Dharineesh_products" });
    const data = await client.send(scanCmd);
    
    for (const item of data.Items) {
        if (item.imageUrl && item.imageUrl.S && item.imageUrl.S.includes("cloudbasket-products-images.s3.ap-southeast-1.amazonaws.com")) {
            const newUrl = item.imageUrl.S.replace("cloudbasket-products-images.s3.ap-southeast-1.amazonaws.com", "d2vghmouksu39n.cloudfront.net");
            const updateCmd = new UpdateItemCommand({
                TableName: "Dharineesh_products",
                Key: { productId: { S: item.productId.S } },
                UpdateExpression: "SET imageUrl = :newUrl",
                ExpressionAttributeValues: { ":newUrl": { S: newUrl } }
            });
            await client.send(updateCmd);
            console.log("Updated", item.name.S);
        }
    }
}
fix().catch(console.error);
