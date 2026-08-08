import dotenv from "dotenv";

dotenv.config();

export const env = {

    PORT: process.env.PORT,

    AWS_REGION: process.env.AWS_REGION,

    COUPONS_TABLE: process.env.COUPONS_TABLE,

    OFFERS_TABLE: process.env.OFFERS_TABLE,

    FESTIVAL_SALES_TABLE: process.env.FESTIVAL_SALES_TABLE

};