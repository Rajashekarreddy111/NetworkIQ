# NetworkIQ Insights

Think like a professional SaaS designer.

Prioritize beautiful UI over generic dashboards.

Use premium cards, spacing, typography, gradients, smooth animations and polished interactions.

Every page should feel like a real enterprise AI product suitable for a real world project


You are an expert Senior Frontend Engineer and UI/UX Designer with experience building enterprise SaaS dashboards for companies like Amazon, Walmart, Microsoft and Flipkart.

Your task is to build a complete production-ready frontend for an AI-powered Supply Chain Inventory Optimization Platform called "NetworkIQ".

The application should look like a premium enterprise product, not a college project.

====================================================

TECH STACK

Use:

• React 19

• TypeScript

• Vite

• Tailwind CSS

• shadcn/ui

• React Router DOM

• TanStack Query

• Axios

• Zustand

• TanStack Table

• Recharts

• React Leaflet (for warehouse map)

• Framer Motion

• Lucide React Icons

• Sonner Toast

Use reusable components.

Use responsive layouts.

Support Desktop, Tablet and Mobile.

Follow modern design principles.

====================================================

DESIGN STYLE

The design should resemble

Microsoft Azure Portal

AWS Console

Power BI

Oracle Supply Chain

SAP Analytics Cloud

The design should feel

• Premium

• Modern

• Minimal

• Enterprise

• Clean

• Spacious

Color Palette

Primary

#2563EB

Success

#16A34A

Danger

#DC2626

Warning

#F59E0B

Background

#0F172A

Card

#1E293B

Text

#F8FAFC

Border Radius

large rounded cards

Soft shadows

Glassmorphism where appropriate

Dark mode by default.

====================================================

APPLICATION NAME

NetworkIQ

Subtitle

AI Powered Inventory Optimization Platform

====================================================

SIDEBAR

Permanent sidebar on desktop.

Collapsible.

Contains icons.

Menu

Dashboard

Inventory Network

AI Recommendations

Planner Approval

Agent Monitor

Benchmark

Analytics

Audit Trail

Settings

Profile

====================================================

TOP NAVBAR

Company Logo

Global Search

Notifications

Theme Toggle

User Avatar

====================================================

PAGE 1

DASHBOARD

Hero

Welcome

Today's AI Insights

Cards

Total Warehouses

Total Stores

Active SKUs

Inventory Value

Holding Cost

Transfer Cost

Estimated Savings

AI Confidence

Pending Transfers

Rejected Transfers

Warehouse Utilization

Stockout Risk

Charts

Demand Forecast

Transfer Trend

Warehouse Utilization

Inventory Distribution

Fast vs Slow Movers

Recent AI Activities timeline

====================================================

PAGE 2

INVENTORY NETWORK

Filters

Region

Warehouse

Category

Velocity Class

Risk Level

Search SKU

Inventory Table

Columns

SKU

Product

Warehouse

Current Stock

Predicted Demand

Days Cover

Velocity

Capacity

Risk

Status

Expandable drawer

Show

Historical demand

Trend

Forecast

Inventory health

Warehouse utilization

Right side

Interactive India Map

Warehouse markers

Transfer routes

Demand heatmap

====================================================

PAGE 3

AI RECOMMENDATIONS

This is the most important page.

Top Summary Cards

Recommendations

Expected Savings

Pending Approval

Average Confidence

Large Enterprise Table

Columns

SKU

Source Warehouse

Destination Warehouse

Quantity

Transfer Cost

Margin Unlocked

Demand Basis

Cost Tradeoff

Cost Per Unit

Status

Confidence

Each row has

View Details

Approve

Reject

Override

Expandable Details

Forecast Graph

Reasoning

Business Impact

Agent Explanation

Confidence Score

Expected Profit

Risk Analysis

====================================================

PAGE 4

PLANNER APPROVAL CENTER

Tabs

Pending

Approved

Rejected

Cards

Transfer Summary

Business Value

Transfer Cost

Margin

Risk

Buttons

Approve

Reject

Override

Modal

Transfer Details

Demand Analysis

Inventory Analysis

Cost Breakdown

Planner Notes

====================================================

PAGE 5

AGENT MONITOR

This page should impress judges.

Show six AI agents.

Demand Forecast Agent

Inventory Agent

Capacity Agent

Transfer Agent

Coordinator Agent

Guardrail Agent

Each card contains

Status

Latency

Confidence

Current Task

Animated connection lines between agents.

Show workflow animation

Demand

↓

Inventory

↓

Coordinator

↓

Optimization

↓

Guardrail

↓

Planner

Live activity feed

====================================================

PAGE 6

BENCHMARK

Compare

Classical Solver

vs

AI Plan

Metric Cards

Holding Cost

Transfer Cost

Stock Availability

Catalog Coverage

Savings

Bar Charts

Radar Chart

Improvement %

====================================================

PAGE 7

ANALYTICS

Charts

Demand Forecast

Warehouse Performance

Transfer Frequency

Category Performance

Inventory Health

Top SKUs

Top Warehouses

Heatmaps

====================================================

PAGE 8

AUDIT TRAIL

Timeline

Every AI recommendation

Planner decision

Execution

Completion

Audit Table

Timestamp

SKU

Transfer

Planner

Decision

Reason

Status

====================================================

PAGE 9

SETTINGS

API Configuration

Theme

Notifications

Planner Threshold

Warehouse Configuration

====================================================

PAGE 10

PROFILE

User

Role

Department

Recent Activity

Logout

====================================================

COMPONENTS

Create reusable components.

Sidebar

Navbar

SummaryCard

ChartCard

TransferTable

InventoryTable

AgentCard

WarehouseCard

BenchmarkCard

AnalyticsChart

AuditTimeline

ApprovalModal

StatusBadge

NotificationPanel

SearchBar

Filters

MapComponent

LoadingSkeleton

ErrorState

EmptyState

====================================================

CHARTS

Use Recharts.

Bar Charts

Line Charts

Pie Charts

Area Charts

Radar Charts

Heatmaps

====================================================

ANIMATIONS

Use Framer Motion.

Page transitions

Card hover

Button animation

Sidebar animation

Agent animation

Loading animation

====================================================

STATE MANAGEMENT

Use Zustand.

Theme

Authentication

Dashboard Data

Planner State

Inventory

====================================================

API LAYER

Create an Axios service.

Prepare hooks for

/dashboard

/inventory

/plan

/self-check

/benchmark

/config

Use mocked JSON initially.

====================================================

RESPONSIVENESS

Fully responsive.

Desktop

Laptop

Tablet

Mobile

No layout breaking.

====================================================

ACCESSIBILITY

Keyboard navigation.

ARIA labels.

Proper contrast.

====================================================

CODE QUALITY

Use TypeScript interfaces.

Modular architecture.

Reusable components.

No duplicated code.

Clean folder structure.

====================================================

OUTPUT

Generate the complete frontend with all pages, routing, reusable components, mocked data, responsive layouts, enterprise-quality UI, animations, and proper project structure.

Do not generate placeholder boxes only.

Generate realistic charts, realistic inventory data, realistic transfer tables, realistic AI recommendations, realistic warehouse information and professional enterprise dashboards.

## Development

You need Node.js and npm.

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
