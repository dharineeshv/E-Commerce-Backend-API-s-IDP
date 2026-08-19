provider "aws" {
  region = "ap-southeast-1"
}

# DynamoDB Tables
resource "aws_dynamodb_table" "cart" {
  name           = "Dharineesh_Cart"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "customerId"
  range_key      = "cartItemId"
  attribute {
    name = "customerId"
    type = "S"
  }
  attribute {
    name = "cartItemId"
    type = "S"
  }
}

resource "aws_dynamodb_table" "coupons" {
  name           = "Dharineesh_Coupons"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "couponId"
  attribute {
    name = "couponId"
    type = "S"
  }
  attribute {
    name = "couponCode"
    type = "S"
  }
  global_secondary_index {
    name               = "couponCode-index"
    hash_key           = "couponCode"
    projection_type    = "ALL"
  }
}

resource "aws_dynamodb_table" "festival_sales" {
  name           = "Dharineesh_FestivalSales"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "festivalSaleId"
  attribute {
    name = "festivalSaleId"
    type = "S"
  }
  attribute {
    name = "status"
    type = "S"
  }
  global_secondary_index {
    name               = "status-index"
    hash_key           = "status"
    projection_type    = "ALL"
  }
}

resource "aws_dynamodb_table" "offers" {
  name           = "Dharineesh_Offers"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "offerId"
  attribute {
    name = "offerId"
    type = "S"
  }
}

resource "aws_dynamodb_table" "inventory" {
  name           = "Dharineesh_Inventory"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "inventoryId"
  attribute {
    name = "inventoryId"
    type = "S"
  }
}

resource "aws_dynamodb_table" "orders" {
  name           = "Orders"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "orderId"
  attribute {
    name = "orderId"
    type = "S"
  }
  attribute {
    name = "customerId"
    type = "S"
  }
  global_secondary_index {
    name               = "customerId-index"
    hash_key           = "customerId"
    projection_type    = "ALL"
  }
}

resource "aws_dynamodb_table" "payments" {
  name           = "Dharineesh_Payments"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "paymentId"
  attribute {
    name = "paymentId"
    type = "S"
  }
}

resource "aws_dynamodb_table" "products" {
  name           = "Dharineesh_Products"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "productId"
  attribute {
    name = "productId"
    type = "S"
  }
}

resource "aws_dynamodb_table" "reviews" {
  name           = "Dharineesh_Reviews"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "reviewId"
  attribute {
    name = "reviewId"
    type = "S"
  }
}

resource "aws_dynamodb_table" "user_profile" {
  name           = "Dharineesh_UserProfile"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "customerId"
  attribute {
    name = "customerId"
    type = "S"
  }
  attribute {
    name = "cognitoSub"
    type = "S"
  }
  global_secondary_index {
    name               = "CognitoSubIndex"
    hash_key           = "cognitoSub"
    projection_type    = "ALL"
  }
}

resource "aws_dynamodb_table" "user_counter" {
  name           = "Dharineesh_UserCounter"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "counterName"
  attribute {
    name = "counterName"
    type = "S"
  }
}

resource "aws_dynamodb_table" "wishlist" {
  name           = "Dharineesh_Wishlist"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "customerId"
  range_key      = "productId"
  attribute {
    name = "customerId"
    type = "S"
  }
  attribute {
    name = "productId"
    type = "S"
  }
}
