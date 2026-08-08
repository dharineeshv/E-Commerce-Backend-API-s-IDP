import fs from 'fs';
import path from 'path';

const base = process.cwd();
const svcs = [
  'authentication-service', 'cart-service', 'inventory-service',
  'marketing-service', 'notification-service', 'order-service',
  'payment-service', 'product-service', 'review-service',
  'user-profile-service', 'wishlist-service'
];

svcs.forEach(svc => {
  const file = path.join(base, svc, 'src', 'app.js');
  if (!fs.existsSync(file)) return;
  let code = fs.readFileSync(file, 'utf8');

  if (!code.includes('setContextMissingStrategy')) {
    code = code.replace('AWSXRay.captureHTTPsGlobal', 'AWSXRay.setContextMissingStrategy("LOG_ERROR");\nAWSXRay.captureHTTPsGlobal');
  }

  code = code.replace(/app\.use\(AWSXRay\.express\.openSegment\(([^)]+)\)\);/g, 'if (!process.env.AWS_LAMBDA_FUNCTION_NAME) {\n  app.use(AWSXRay.express.openSegment($1));\n}');
  code = code.replace(/app\.use\(AWSXRay\.express\.closeSegment\(\)\);/g, 'if (!process.env.AWS_LAMBDA_FUNCTION_NAME) {\n  app.use(AWSXRay.express.closeSegment());\n}');

  fs.writeFileSync(file, code, 'utf8');
  console.log('Updated ' + svc + ' app.js');
});
