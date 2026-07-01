import "../config/env.js";
import {
  PutCommand,
  DeleteCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";

import dynamodb from "../config/dynamodb.js";
import { v4 as uuidv4 } from "uuid";

const CART_TABLE = process.env.CART_TABLE || "Cart";

// Add product to cart
const addProductToCart = async (customerId, product) => {
  try {
    const { productId, productName, price, quantity } = product;

    // Generate a unique item ID for this cart item
    const cartItemId = uuidv4();

    const params = {
      TableName: CART_TABLE,
      Item: {
        customerId: customerId,
        cartItemId: cartItemId,
        productId: productId,
        productName: productName,
        price: price,
        quantity: quantity,
        totalPrice: price * quantity,
        addedAt: new Date().toISOString(),
      },
    };

    await dynamodb.send(new PutCommand(params));

    return {
      success: true,
      message: "Product added to cart successfully",
      data: params.Item,
    };
  } catch (error) {
    throw new Error(`Failed to add product to cart: ${error.message}`);
  }
};

// Get all products in cart for a customer
const getCartProducts = async (customerId) => {
  try {
    const params = {
      TableName: CART_TABLE,
      KeyConditionExpression: "customerId = :customerId",
      ExpressionAttributeValues: {
        ":customerId": customerId,
      },
    };

    const response = await dynamodb.send(new QueryCommand(params));

    const cartItems = response.Items || [];
    const cartTotal = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);

    return {
      success: true,
      message: "Cart retrieved successfully",
      data: cartItems,
      cartTotal: cartTotal,
      itemCount: cartItems.length,
    };
  } catch (error) {
    throw new Error(`Failed to retrieve cart: ${error.message}`);
  }
};

const getCartItem = async (customerId, cartItemId) => {
  try {
    const params = {
      TableName: CART_TABLE,
      KeyConditionExpression: "customerId = :customerId",
      FilterExpression: "cartItemId = :cartItemId",
      ExpressionAttributeValues: {
        ":customerId": String(customerId),
        ":cartItemId": String(cartItemId),
      },
    };

    const response = await dynamodb.send(new QueryCommand(params));
    return response.Items?.[0] || null;
  } catch (error) {
    throw new Error(`Failed to retrieve cart item: ${error.message}`);
  }
};

// Delete product from cart
const deleteProductFromCart = async (customerId, cartItemId) => {
  try {
    const queryParams = {
      TableName: CART_TABLE,
      KeyConditionExpression: "customerId = :customerId",
      FilterExpression: "cartItemId = :cartItemId",
      ExpressionAttributeValues: {
        ":customerId": String(customerId),
        ":cartItemId": String(cartItemId),
      },
    };

    const queryResponse = await dynamodb.send(new QueryCommand(queryParams));
    
    if (!queryResponse.Items || queryResponse.Items.length === 0) {
      throw new Error("Cart item not found");
    }

    await dynamodb.send(
      new DeleteCommand({
        TableName: CART_TABLE,
        Key: {
          customerId: String(customerId),
          cartItemId: String(cartItemId),
        },
      })
    );

    return {
      success: true,
      message: "Product removed from cart successfully",
    };
  } catch (error) {
    throw new Error(`Failed to delete product from cart: ${error.message}`);
  }
};

// Update product quantity in cart
const updateProductQuantity = async (customerId, cartItemId, quantity) => {
  try {
    // Fetch existing item using QueryCommand
    const queryParams = {
      TableName: CART_TABLE,
      KeyConditionExpression: "customerId = :customerId",
      FilterExpression: "cartItemId = :cartItemId",
      ExpressionAttributeValues: {
        ":customerId": String(customerId),
        ":cartItemId": String(cartItemId),
      },
    };

    const queryResponse = await dynamodb.send(new QueryCommand(queryParams));
    const cartItem = queryResponse.Items?.[0];

    if (!cartItem) {
      throw new Error("Cart item not found");
    }

    const totalPrice = cartItem.price * quantity;

    // Update using PutCommand to overwrite the existing item
    const putParams = {
      TableName: CART_TABLE,
      Item: {
        ...cartItem,
        quantity,
        totalPrice,
      },
    };

    await dynamodb.send(new PutCommand(putParams));

    return {
      success: true,
      message: "Product quantity updated successfully",
      data: {
        ...cartItem,
        quantity,
        totalPrice,
      },
    };
  } catch (error) {
    throw new Error(`Failed to update product quantity: ${error.message}`);
  }
};

// Clear entire cart for a customer
const clearCart = async (customerId) => {
  try {
    const queryParams = {
      TableName: CART_TABLE,
      KeyConditionExpression: "customerId = :customerId",
      ExpressionAttributeValues: {
        ":customerId": customerId,
      },
    };

    const response = await dynamodb.send(new QueryCommand(queryParams));
    const cartItems = response.Items || [];

    if (cartItems.length === 0) {
      return {
        success: true,
        message: "Cart is already empty",
      };
    }

    const deletePromises = cartItems.map((item) => {
      return dynamodb.send(
        new DeleteCommand({
          TableName: CART_TABLE,
          Key: {
            customerId: item.customerId,
            cartItemId: item.cartItemId,
          },
        })
      );
    });

    await Promise.all(deletePromises);

    return {
      success: true,
      message: "Cart cleared successfully",
    };
  } catch (error) {
    throw new Error(`Failed to clear cart: ${error.message}`);
  }
};

export {
  addProductToCart,
  getCartProducts,
  getCartItem,
  deleteProductFromCart,
  updateProductQuantity,
  clearCart,
};
