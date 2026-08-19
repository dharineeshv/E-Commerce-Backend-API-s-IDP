resource "aws_cognito_user_pool" "pool" {
  name = "Dharineesh_UserPool"
  auto_verified_attributes = ["email"]
}

resource "aws_cognito_user_pool_client" "client" {
  name = "Dharineesh_AppClient"
  user_pool_id = aws_cognito_user_pool.pool.id
  generate_secret = false
  explicit_auth_flows = [
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH"
  ]
  supported_identity_providers = ["COGNITO", "Google"]
  allowed_oauth_flows          = ["implicit", "code"]
  allowed_oauth_scopes         = ["phone", "email", "openid", "profile"]
  allowed_oauth_flows_user_pool_client = true
  callback_urls                = ["https://dl21dk0zl04jl.cloudfront.net", "https://dl21dk0zl04jl.cloudfront.net/", "https://dl21dk0zl04jl.cloudfront.net/login.html", "https://dl21dk0zl04jl.cloudfront.net/index.html", "https://dl21dk0zl04jl.cloudfront.net/register.html", "http://localhost:5500", "http://127.0.0.1:5500"]
  logout_urls                  = ["https://dl21dk0zl04jl.cloudfront.net"]
}

resource "aws_cognito_user_pool_domain" "domain" {
  domain       = "cloudbasket-dharineesh-personal"
  user_pool_id = aws_cognito_user_pool.pool.id
}
