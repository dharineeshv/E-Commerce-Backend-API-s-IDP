const fs = require('fs');
const path = 'C:/Users/dharineesh.v/OneDrive - IDP Education Ltd/Documents/E-Commerce App/CloudBasket-Frontend/pages/orders/orders.html';

let content = fs.readFileSync(path, 'utf-8');

// The real content starts exactly at: <!-- Profile Section -->
const marker = '<!-- Profile Section -->';
const profileIdx = content.lastIndexOf(marker);

let correctBody = content.substring(profileIdx);

const newHeader = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CloudBasket Admin - Orders Management</title>

    <!-- Google Fonts: Inter -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet">

    <!-- CSS -->
    <link rel="stylesheet" href="../../css/variables.css">
    <link rel="stylesheet" href="../../css/common.css">
    <link rel="stylesheet" href="../../css/dashboard.css">
    <link rel="stylesheet" href="../../css/header.css">
    <link rel="stylesheet" href="../../css/sidebar.css">
    <link rel="stylesheet" href="../../css/logout.css">
    <link rel="stylesheet" href="../../css/profile.css">
    <link rel="stylesheet" href="../../css/admin-orders.css">
    <link rel="stylesheet" href="../../css/chatbot.css">

    <style>
        /* Base overrides to apply Inter font */
        body {
            font-family: 'Inter', sans-serif;
            background: #f8fafc;
        }
    </style>
</head>
<body>
<div class="dashboard">

    <!-- Header -->
    <header class="dashboard-header">
        <div class="header-left">
            <button class="menu-toggle" id="menu-toggle" aria-label="Toggle Sidebar">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <line x1="3" y1="12" x2="21" y2="12"></line>
                    <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
            </button>
            <div class="logo-section">
                <img src="../../assets/logo.png" alt="CloudBasket Logo" class="logo">
                <div class="logo-text">
                    <h2>CloudBasket</h2>
                    <span>Enterprise Admin</span>
                </div>
            </div>
        </div>

        <div class="header-right">
            `;

fs.writeFileSync(path, newHeader + correctBody);
console.log("Cleaned up HTML!");
