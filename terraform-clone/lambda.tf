data "archive_file" "dummy" {
  type        = "zip"
  output_path = "dummy.zip"
  source {
    content  = "exports.handler = async (event) => { return { statusCode: 200, body: 'Dummy' }; };"
    filename = "lambda.js"
  }
}

locals {
  env_vars = {
    PORT = "3000"
    ALLOWED_ORIGINS = "*"
    COGNITO_USER_POOL_ID = aws_cognito_user_pool.pool.id
    COGNITO_CLIENT_ID = aws_cognito_user_pool_client.client.id
    CART_TABLE = aws_dynamodb_table.cart.name
    INVENTORY_TABLE = aws_dynamodb_table.inventory.name
    COUPONS_TABLE = aws_dynamodb_table.coupons.name
    OFFERS_TABLE = aws_dynamodb_table.offers.name
    FESTIVAL_SALES_TABLE = aws_dynamodb_table.festival_sales.name
    ORDER_TABLE = aws_dynamodb_table.orders.name
    PAYMENT_TABLE = aws_dynamodb_table.payments.name
    PRODUCTS_TABLE = aws_dynamodb_table.products.name
    DYNAMODB_TABLE = aws_dynamodb_table.products.name
    REVIEW_TABLE = aws_dynamodb_table.reviews.name
    USER_PROFILE_TABLE = aws_dynamodb_table.user_profile.name
    USER_COUNTER_TABLE = aws_dynamodb_table.user_counter.name
    WISHLIST_TABLE = aws_dynamodb_table.wishlist.name
    RAZORPAY_KEY_ID = var.razorpay_key_id
    RAZORPAY_KEY_SECRET = var.razorpay_key_secret
    GMAIL_EMAIL = var.gmail_email
    GMAIL_APP_PASSWORD = var.gmail_app_password
  }
}

resource "aws_lambda_function" "auth" {
  function_name = "Dharineesh_Auth-Service"
  role          = aws_iam_role.lambda_execution_role.arn
  handler       = "authentication-service/lambda.handler"
  runtime       = "nodejs20.x"
  filename      = data.archive_file.dummy.output_path
  environment {
    variables = local.env_vars
  }
}

resource "aws_lambda_function" "cart" {
  function_name = "Dharineesh_cart-service"
  role          = aws_iam_role.lambda_execution_role.arn
  handler       = "cart-service/lambda.handler"
  runtime       = "nodejs20.x"
  filename      = data.archive_file.dummy.output_path
  environment {
    variables = local.env_vars
  }
}

resource "aws_lambda_function" "inventory" {
  function_name = "Dharineesh_inventory-service"
  role          = aws_iam_role.lambda_execution_role.arn
  handler       = "inventory-service/lambda.handler"
  runtime       = "nodejs20.x"
  filename      = data.archive_file.dummy.output_path
  environment {
    variables = local.env_vars
  }
}

resource "aws_lambda_function" "marketing" {
  function_name = "Dharineesh_Marketing_Services"
  role          = aws_iam_role.lambda_execution_role.arn
  handler       = "marketing-service/lambda.handler"
  runtime       = "nodejs20.x"
  filename      = data.archive_file.dummy.output_path
  environment {
    variables = local.env_vars
  }
}

resource "aws_lambda_function" "notification" {
  function_name = "Dharineesh_Notification-Service"
  role          = aws_iam_role.lambda_execution_role.arn
  handler       = "notification-service/lambda.handler"
  runtime       = "nodejs20.x"
  filename      = data.archive_file.dummy.output_path
  environment {
    variables = local.env_vars
  }
}

resource "aws_lambda_function" "order" {
  function_name = "Dharineesh_order-service"
  role          = aws_iam_role.lambda_execution_role.arn
  handler       = "order-service/lambda.handler"
  runtime       = "nodejs20.x"
  filename      = data.archive_file.dummy.output_path
  environment {
    variables = local.env_vars
  }
}

resource "aws_lambda_function" "payment" {
  function_name = "Dharineesh_payment-service"
  role          = aws_iam_role.lambda_execution_role.arn
  handler       = "payment-service/lambda.handler"
  runtime       = "nodejs20.x"
  filename      = data.archive_file.dummy.output_path
  environment {
    variables = local.env_vars
  }
}

resource "aws_lambda_function" "product" {
  function_name = "Dharineesh_product_service"
  role          = aws_iam_role.lambda_execution_role.arn
  handler       = "product-service/lambda.handler"
  runtime       = "nodejs20.x"
  filename      = data.archive_file.dummy.output_path
  environment {
    variables = local.env_vars
  }
}

resource "aws_lambda_function" "review" {
  function_name = "Dharineesh_review-service"
  role          = aws_iam_role.lambda_execution_role.arn
  handler       = "review-service/lambda.handler"
  runtime       = "nodejs20.x"
  filename      = data.archive_file.dummy.output_path
  environment {
    variables = local.env_vars
  }
}

resource "aws_lambda_function" "user_profile" {
  function_name = "Dharineesh_Profile-Service"
  role          = aws_iam_role.lambda_execution_role.arn
  handler       = "user-profile-service/lambda.handler"
  runtime       = "nodejs20.x"
  filename      = data.archive_file.dummy.output_path
  environment { variables = local.env_vars }
}

resource "aws_lambda_function" "wishlist" {
  function_name = "Dharineesh_wishlist"
  role          = aws_iam_role.lambda_execution_role.arn
  handler       = "wishlist-service/lambda.handler"
  runtime       = "nodejs20.x"
  filename      = data.archive_file.dummy.output_path
  environment { variables = local.env_vars }
}
