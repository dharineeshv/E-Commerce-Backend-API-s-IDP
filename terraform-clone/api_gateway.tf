
resource "aws_api_gateway_rest_api" "api" {
  name = "CloudBasket-API-Clone"
  body = jsonencode({
    openapi = "3.0.1"
    info = {
      title   = "CloudBasket API Clone"
      version = "1.0.0"
    }
    paths = {
    "/api/v1/auth/{proxy+}": {
        "x-amazon-apigateway-any-method": {
            "x-amazon-apigateway-integration": {
                "type": "aws_proxy",
                "httpMethod": "POST",
                "uri": "${aws_lambda_function.auth.invoke_arn}"
            }
        }
    },
    "/api/v1/auth": {
        "x-amazon-apigateway-any-method": {
            "x-amazon-apigateway-integration": {
                "type": "aws_proxy",
                "httpMethod": "POST",
                "uri": "${aws_lambda_function.auth.invoke_arn}"
            }
        }
    },
    "/api/v1/cart/{proxy+}": {
        "x-amazon-apigateway-any-method": {
            "x-amazon-apigateway-integration": {
                "type": "aws_proxy",
                "httpMethod": "POST",
                "uri": "${aws_lambda_function.cart.invoke_arn}"
            }
        }
    },
    "/api/v1/cart": {
        "x-amazon-apigateway-any-method": {
            "x-amazon-apigateway-integration": {
                "type": "aws_proxy",
                "httpMethod": "POST",
                "uri": "${aws_lambda_function.cart.invoke_arn}"
            }
        }
    },
    "/api/v1/inventory/{proxy+}": {
        "x-amazon-apigateway-any-method": {
            "x-amazon-apigateway-integration": {
                "type": "aws_proxy",
                "httpMethod": "POST",
                "uri": "${aws_lambda_function.inventory.invoke_arn}"
            }
        }
    },
    "/api/v1/inventory": {
        "x-amazon-apigateway-any-method": {
            "x-amazon-apigateway-integration": {
                "type": "aws_proxy",
                "httpMethod": "POST",
                "uri": "${aws_lambda_function.inventory.invoke_arn}"
            }
        }
    },
    "/api/v1/marketing/{proxy+}": {
        "x-amazon-apigateway-any-method": {
            "x-amazon-apigateway-integration": {
                "type": "aws_proxy",
                "httpMethod": "POST",
                "uri": "${aws_lambda_function.marketing.invoke_arn}"
            }
        }
    },
    "/api/v1/marketing": {
        "x-amazon-apigateway-any-method": {
            "x-amazon-apigateway-integration": {
                "type": "aws_proxy",
                "httpMethod": "POST",
                "uri": "${aws_lambda_function.marketing.invoke_arn}"
            }
        }
    },
    "/api/v1/notification/{proxy+}": {
        "x-amazon-apigateway-any-method": {
            "x-amazon-apigateway-integration": {
                "type": "aws_proxy",
                "httpMethod": "POST",
                "uri": "${aws_lambda_function.notification.invoke_arn}"
            }
        }
    },
    "/api/v1/notification": {
        "x-amazon-apigateway-any-method": {
            "x-amazon-apigateway-integration": {
                "type": "aws_proxy",
                "httpMethod": "POST",
                "uri": "${aws_lambda_function.notification.invoke_arn}"
            }
        }
    },
    "/api/v1/order/{proxy+}": {
        "x-amazon-apigateway-any-method": {
            "x-amazon-apigateway-integration": {
                "type": "aws_proxy",
                "httpMethod": "POST",
                "uri": "${aws_lambda_function.order.invoke_arn}"
            }
        }
    },
    "/api/v1/order": {
        "x-amazon-apigateway-any-method": {
            "x-amazon-apigateway-integration": {
                "type": "aws_proxy",
                "httpMethod": "POST",
                "uri": "${aws_lambda_function.order.invoke_arn}"
            }
        }
    },
    "/api/v1/payment/{proxy+}": {
        "x-amazon-apigateway-any-method": {
            "x-amazon-apigateway-integration": {
                "type": "aws_proxy",
                "httpMethod": "POST",
                "uri": "${aws_lambda_function.payment.invoke_arn}"
            }
        }
    },
    "/api/v1/payment": {
        "x-amazon-apigateway-any-method": {
            "x-amazon-apigateway-integration": {
                "type": "aws_proxy",
                "httpMethod": "POST",
                "uri": "${aws_lambda_function.payment.invoke_arn}"
            }
        }
    },
    "/api/v1/product/{proxy+}": {
        "x-amazon-apigateway-any-method": {
            "x-amazon-apigateway-integration": {
                "type": "aws_proxy",
                "httpMethod": "POST",
                "uri": "${aws_lambda_function.product.invoke_arn}"
            }
        }
    },
    "/api/v1/product": {
        "x-amazon-apigateway-any-method": {
            "x-amazon-apigateway-integration": {
                "type": "aws_proxy",
                "httpMethod": "POST",
                "uri": "${aws_lambda_function.product.invoke_arn}"
            }
        }
    },
    "/api/v1/review/{proxy+}": {
        "x-amazon-apigateway-any-method": {
            "x-amazon-apigateway-integration": {
                "type": "aws_proxy",
                "httpMethod": "POST",
                "uri": "${aws_lambda_function.review.invoke_arn}"
            }
        }
    },
    "/api/v1/review": {
        "x-amazon-apigateway-any-method": {
            "x-amazon-apigateway-integration": {
                "type": "aws_proxy",
                "httpMethod": "POST",
                "uri": "${aws_lambda_function.review.invoke_arn}"
            }
        }
    },
    "/api/v1/profile/{proxy+}": {
        "x-amazon-apigateway-any-method": {
            "x-amazon-apigateway-integration": {
                "type": "aws_proxy",
                "httpMethod": "POST",
                "uri": "${aws_lambda_function.user_profile.invoke_arn}"
            }
        }
    },
    "/api/v1/profile": {
        "x-amazon-apigateway-any-method": {
            "x-amazon-apigateway-integration": {
                "type": "aws_proxy",
                "httpMethod": "POST",
                "uri": "${aws_lambda_function.user_profile.invoke_arn}"
            }
        }
    },
    "/api/v1/wishlist/{proxy+}": {
        "x-amazon-apigateway-any-method": {
            "x-amazon-apigateway-integration": {
                "type": "aws_proxy",
                "httpMethod": "POST",
                "uri": "${aws_lambda_function.wishlist.invoke_arn}"
            }
        }
    },
    "/api/v1/wishlist": {
        "x-amazon-apigateway-any-method": {
            "x-amazon-apigateway-integration": {
                "type": "aws_proxy",
                "httpMethod": "POST",
                "uri": "${aws_lambda_function.wishlist.invoke_arn}"
            }
        }
    }
}
  })
}

resource "aws_api_gateway_deployment" "deployment" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  triggers = {
    redeployment = sha1(jsonencode(aws_api_gateway_rest_api.api.body))
  }
  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_api_gateway_stage" "prod" {
  deployment_id = aws_api_gateway_deployment.deployment.id
  rest_api_id   = aws_api_gateway_rest_api.api.id
  stage_name    = "api"
}


resource "aws_lambda_permission" "auth_apigw" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.auth.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "cart_apigw" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.cart.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "inventory_apigw" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.inventory.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "marketing_apigw" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.marketing.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "notification_apigw" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.notification.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "order_apigw" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.order.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "payment_apigw" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.payment.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "product_apigw" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.product.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "review_apigw" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.review.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "user_profile_apigw" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.user_profile.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "wishlist_apigw" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.wishlist.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.api.execution_arn}/*/*"
}
