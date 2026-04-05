"""
Marketplace Command Center — data layer.

Generates realistic simulated seller data across Amazon, Flipkart, and Meesho.
In production replace with real Seller API connectors or CSV uploads.

All monetary values are in INR (₹).
"""
from __future__ import annotations

import random
from dataclasses import dataclass, field
from typing import List, Dict, Any

# ─── Seed data ────────────────────────────────────────────────────────────────

PLATFORMS = ["amazon", "flipkart", "meesho"]

PRODUCTS = [
    {"id": "SKU-001", "name": "Cotton Kurta Set",         "category": "Apparel"},
    {"id": "SKU-002", "name": "Stainless Steel Bottle",   "category": "Kitchen"},
    {"id": "SKU-003", "name": "Wireless Earbuds",         "category": "Electronics"},
    {"id": "SKU-004", "name": "Yoga Mat Premium",         "category": "Sports"},
    {"id": "SKU-005", "name": "Leather Wallet",           "category": "Accessories"},
    {"id": "SKU-006", "name": "Herbal Face Wash",         "category": "Beauty"},
    {"id": "SKU-007", "name": "Dumbbell Set 10kg",        "category": "Sports"},
    {"id": "SKU-008", "name": "Ceramic Coffee Mug",       "category": "Kitchen"},
]

# Platform fee rates (as fraction of selling price)
PLATFORM_FEES = {"amazon": 0.15, "flipkart": 0.12, "meesho": 0.05}

# Shipping cost per order per platform (INR)
SHIPPING_COST = {"amazon": 60, "flipkart": 45, "meesho": 30}

# Base prices per product — platform-specific (INR)
BASE_PRICES: Dict[str, Dict[str, float]] = {
    "SKU-001": {"amazon": 899,  "flipkart": 849,  "meesho": 699},
    "SKU-002": {"amazon": 499,  "flipkart": 479,  "meesho": 399},
    "SKU-003": {"amazon": 1499, "flipkart": 1399, "meesho": 1199},
    "SKU-004": {"amazon": 699,  "flipkart": 649,  "meesho": 549},
    "SKU-005": {"amazon": 599,  "flipkart": 579,  "meesho": 449},
    "SKU-006": {"amazon": 349,  "flipkart": 329,  "meesho": 279},
    "SKU-007": {"amazon": 1899, "flipkart": 1799, "meesho": 1599},
    "SKU-008": {"amazon": 299,  "flipkart": 279,  "meesho": 229},
}

# Cost of goods (INR)
COGS: Dict[str, float] = {
    "SKU-001": 380, "SKU-002": 180, "SKU-003": 650, "SKU-004": 250,
    "SKU-005": 220, "SKU-006": 110, "SKU-007": 820, "SKU-008": 90,
}

# Simulated stock levels per product per platform
STOCK: Dict[str, Dict[str, int]] = {
    "SKU-001": {"amazon": 45,  "flipkart": 82,  "meesho": 120},
    "SKU-002": {"amazon": 8,   "flipkart": 15,  "meesho": 6},
    "SKU-003": {"amazon": 23,  "flipkart": 0,   "meesho": 11},
    "SKU-004": {"amazon": 67,  "flipkart": 34,  "meesho": 89},
    "SKU-005": {"amazon": 3,   "flipkart": 12,  "meesho": 18},
    "SKU-006": {"amazon": 95,  "flipkart": 110, "meesho": 200},
    "SKU-007": {"amazon": 5,   "flipkart": 2,   "meesho": 9},
    "SKU-008": {"amazon": 150, "flipkart": 88,  "meesho": 210},
}

# Average daily sales velocity per product per platform
DAILY_VELOCITY: Dict[str, Dict[str, float]] = {
    "SKU-001": {"amazon": 4.2, "flipkart": 6.1, "meesho": 8.5},
    "SKU-002": {"amazon": 2.8, "flipkart": 3.2, "meesho": 1.9},
    "SKU-003": {"amazon": 1.5, "flipkart": 0.0, "meesho": 0.8},
    "SKU-004": {"amazon": 1.8, "flipkart": 2.1, "meesho": 3.2},
    "SKU-005": {"amazon": 3.5, "flipkart": 4.2, "meesho": 2.1},
    "SKU-006": {"amazon": 5.2, "flipkart": 6.8, "meesho": 12.1},
    "SKU-007": {"amazon": 0.9, "flipkart": 0.6, "meesho": 1.4},
    "SKU-008": {"amazon": 3.1, "flipkart": 2.4, "meesho": 4.8},
}

# Return rates per platform
RETURN_RATES: Dict[str, Dict[str, float]] = {
    "SKU-001": {"amazon": 0.08, "flipkart": 0.12, "meesho": 0.18},
    "SKU-002": {"amazon": 0.03, "flipkart": 0.04, "meesho": 0.05},
    "SKU-003": {"amazon": 0.06, "flipkart": 0.00, "meesho": 0.09},
    "SKU-004": {"amazon": 0.04, "flipkart": 0.05, "meesho": 0.07},
    "SKU-005": {"amazon": 0.11, "flipkart": 0.09, "meesho": 0.22},
    "SKU-006": {"amazon": 0.02, "flipkart": 0.03, "meesho": 0.04},
    "SKU-007": {"amazon": 0.05, "flipkart": 0.07, "meesho": 0.06},
    "SKU-008": {"amazon": 0.02, "flipkart": 0.03, "meesho": 0.03},
}

# Ratings per product per platform
RATINGS: Dict[str, Dict[str, float]] = {
    "SKU-001": {"amazon": 4.3, "flipkart": 4.1, "meesho": 3.8},
    "SKU-002": {"amazon": 4.5, "flipkart": 4.4, "meesho": 4.2},
    "SKU-003": {"amazon": 3.9, "flipkart": 0.0, "meesho": 3.7},
    "SKU-004": {"amazon": 4.6, "flipkart": 4.5, "meesho": 4.4},
    "SKU-005": {"amazon": 3.7, "flipkart": 3.9, "meesho": 3.2},
    "SKU-006": {"amazon": 4.4, "flipkart": 4.3, "meesho": 4.1},
    "SKU-007": {"amazon": 4.2, "flipkart": 4.0, "meesho": 4.1},
    "SKU-008": {"amazon": 4.7, "flipkart": 4.6, "meesho": 4.5},
}

WEEKS = [f"W{i}" for i in range(1, 9)]

rng = random.Random(42)

def _weekly_orders(sku: str, platform: str, base: float) -> List[int]:
    trend = rng.uniform(0.95, 1.12)
    return [max(0, int(base * 7 * (trend ** i) + rng.gauss(0, base))) for i in range(8)]


# ─── Computed helpers ─────────────────────────────────────────────────────────

def calc_profit(sku: str, platform: str, qty: int = 1) -> Dict[str, float]:
    price = BASE_PRICES[sku][platform]
    fees = price * PLATFORM_FEES[platform]
    ship = SHIPPING_COST[platform]
    cogs = COGS[sku]
    profit = (price - fees - ship - cogs) * qty
    margin = (profit / (price * qty)) if price else 0
    return {
        "selling_price": price,
        "platform_fee": round(fees, 2),
        "shipping": ship,
        "cogs": cogs,
        "profit_per_unit": round(price - fees - ship - cogs, 2),
        "profit": round(profit, 2),
        "margin_pct": round(margin * 100, 2),
    }


def days_until_stockout(sku: str, platform: str) -> float | None:
    vel = DAILY_VELOCITY[sku][platform]
    stock = STOCK[sku][platform]
    if vel == 0:
        return None
    return round(stock / vel, 1)


# ─── Endpoint payloads ────────────────────────────────────────────────────────

def get_command_center() -> Dict[str, Any]:
    """Unified multi-platform summary."""
    platform_totals: Dict[str, Dict[str, float]] = {p: {"revenue": 0, "orders": 0, "profit": 0} for p in PLATFORMS}
    weekly_revenue: Dict[str, List[float]] = {p: [0.0] * 8 for p in PLATFORMS}

    for prod in PRODUCTS:
        sku = prod["id"]
        for platform in PLATFORMS:
            weekly_orders = _weekly_orders(sku, platform, DAILY_VELOCITY[sku][platform])
            price = BASE_PRICES[sku][platform]
            p_data = calc_profit(sku, platform)
            for w, orders in enumerate(weekly_orders):
                weekly_revenue[platform][w] += orders * price
            total_orders = sum(weekly_orders)
            platform_totals[platform]["orders"] += total_orders
            platform_totals[platform]["revenue"] += total_orders * price
            platform_totals[platform]["profit"] += total_orders * p_data["profit_per_unit"]

    total_revenue = sum(v["revenue"] for v in platform_totals.values())
    total_orders = sum(v["orders"] for v in platform_totals.values())
    total_profit = sum(v["profit"] for v in platform_totals.values())

    platform_summary = []
    for p in PLATFORMS:
        pt = platform_totals[p]
        share = (pt["revenue"] / total_revenue * 100) if total_revenue else 0
        platform_summary.append({
            "platform": p,
            "revenue": round(pt["revenue"], 0),
            "orders": int(pt["orders"]),
            "profit": round(pt["profit"], 0),
            "share_pct": round(share, 1),
        })

    weekly_combined = [
        {
            "week": WEEKS[i],
            "amazon": round(weekly_revenue["amazon"][i], 0),
            "flipkart": round(weekly_revenue["flipkart"][i], 0),
            "meesho": round(weekly_revenue["meesho"][i], 0),
            "total": round(sum(weekly_revenue[p][i] for p in PLATFORMS), 0),
        }
        for i in range(8)
    ]

    # Active alerts
    alerts = []
    for prod in PRODUCTS:
        sku = prod["id"]
        for platform in PLATFORMS:
            days = days_until_stockout(sku, platform)
            if days is not None and days <= 5:
                alerts.append({
                    "type": "stockout",
                    "severity": "high" if days <= 2 else "medium",
                    "message": f"{prod['name']} on {platform.title()} — out of stock in {days} days",
                    "sku": sku, "platform": platform,
                })
            p_data = calc_profit(sku, platform)
            if p_data["profit_per_unit"] < 0:
                alerts.append({
                    "type": "negative_profit",
                    "severity": "high",
                    "message": f"{prod['name']} on {platform.title()} — losing ₹{abs(p_data['profit_per_unit']):.0f} per order",
                    "sku": sku, "platform": platform,
                })
            rr = RETURN_RATES[sku][platform]
            if rr > 0.15:
                alerts.append({
                    "type": "high_returns",
                    "severity": "medium",
                    "message": f"{prod['name']} on {platform.title()} — {rr*100:.0f}% return rate",
                    "sku": sku, "platform": platform,
                })

    # Arbitrage insights
    arbitrage = []
    for prod in PRODUCTS:
        sku = prod["id"]
        prices = {p: BASE_PRICES[sku][p] for p in PLATFORMS}
        profits = {p: calc_profit(sku, p)["profit_per_unit"] for p in PLATFORMS}
        best_price_platform = max(prices, key=prices.get)
        worst_price_platform = min(prices, key=prices.get)
        if prices[best_price_platform] - prices[worst_price_platform] > 80:
            arbitrage.append({
                "sku": sku,
                "name": prod["name"],
                "high_platform": best_price_platform,
                "high_price": prices[best_price_platform],
                "low_platform": worst_price_platform,
                "low_price": prices[worst_price_platform],
                "gain_per_unit": round(profits[best_price_platform] - profits[worst_price_platform], 0),
                "insight": f"Shift inventory to {best_price_platform.title()} for +₹{profits[best_price_platform] - profits[worst_price_platform]:.0f} profit per unit",
            })

    return {
        "total_revenue": round(total_revenue, 0),
        "total_orders": int(total_orders),
        "total_profit": round(total_profit, 0),
        "overall_margin_pct": round((total_profit / total_revenue * 100) if total_revenue else 0, 1),
        "platform_summary": platform_summary,
        "weekly_revenue": weekly_combined,
        "alerts": alerts[:8],
        "arbitrage_insights": arbitrage[:4],
    }


def get_product_intelligence() -> Dict[str, Any]:
    products = []
    for prod in PRODUCTS:
        sku = prod["id"]
        platform_data = []
        for platform in PLATFORMS:
            weekly_orders = _weekly_orders(sku, platform, DAILY_VELOCITY[sku][platform])
            total_orders = sum(weekly_orders)
            p_data = calc_profit(sku, platform)
            platform_data.append({
                "platform": platform,
                "orders": total_orders,
                "revenue": round(total_orders * BASE_PRICES[sku][platform], 0),
                "profit": round(total_orders * p_data["profit_per_unit"], 0),
                "profit_per_unit": p_data["profit_per_unit"],
                "margin_pct": p_data["margin_pct"],
                "return_rate": round(RETURN_RATES[sku][platform] * 100, 1),
                "rating": RATINGS[sku][platform],
                "stock": STOCK[sku][platform],
                "price": BASE_PRICES[sku][platform],
            })
        total_rev = sum(p["revenue"] for p in platform_data)
        best_platform = max(platform_data, key=lambda x: x["profit_per_unit"])
        worst_platform = min(platform_data, key=lambda x: x["profit_per_unit"])
        products.append({
            **prod,
            "platforms": platform_data,
            "total_revenue": round(total_rev, 0),
            "total_orders": sum(p["orders"] for p in platform_data),
            "avg_rating": round(sum(p["rating"] for p in platform_data if p["rating"] > 0) /
                                max(1, sum(1 for p in platform_data if p["rating"] > 0)), 2),
            "best_platform": best_platform["platform"],
            "worst_platform": worst_platform["platform"],
            "insight": f"Best margin on {best_platform['platform'].title()} ({best_platform['margin_pct']:.1f}%); lowest on {worst_platform['platform'].title()} ({worst_platform['margin_pct']:.1f}%)",
        })
    return {"products": products}


def get_profit_leakage() -> Dict[str, Any]:
    rows = []
    total_leaked = 0.0
    for prod in PRODUCTS:
        sku = prod["id"]
        for platform in PLATFORMS:
            weekly_orders = _weekly_orders(sku, platform, DAILY_VELOCITY[sku][platform])
            total_orders = sum(weekly_orders)
            p_data = calc_profit(sku, platform)
            if total_orders == 0:
                continue
            total_profit = p_data["profit_per_unit"] * total_orders
            fee_leak = p_data["platform_fee"] * total_orders
            ship_leak = p_data["shipping"] * total_orders
            return_leak = RETURN_RATES[sku][platform] * total_orders * (p_data["selling_price"] * 0.8)
            leakage = fee_leak + ship_leak + return_leak
            total_leaked += leakage if p_data["profit_per_unit"] < 50 else 0
            rows.append({
                "sku": sku,
                "name": prod["name"],
                "platform": platform,
                "orders": total_orders,
                "revenue": round(total_orders * p_data["selling_price"], 0),
                "platform_fee_total": round(fee_leak, 0),
                "shipping_total": round(ship_leak, 0),
                "return_cost": round(return_leak, 0),
                "profit_per_unit": p_data["profit_per_unit"],
                "total_profit": round(total_profit, 0),
                "margin_pct": p_data["margin_pct"],
                "is_loss_making": p_data["profit_per_unit"] < 0,
                "leakage_flag": "critical" if p_data["profit_per_unit"] < 0 else "warning" if p_data["margin_pct"] < 10 else "ok",
            })
    rows.sort(key=lambda r: r["profit_per_unit"])
    return {"rows": rows, "total_leakage_estimate": round(total_leaked, 0)}


def get_restock_planner() -> Dict[str, Any]:
    items = []
    for prod in PRODUCTS:
        sku = prod["id"]
        for platform in PLATFORMS:
            vel = DAILY_VELOCITY[sku][platform]
            stock = STOCK[sku][platform]
            if vel == 0:
                continue
            days = stock / vel
            lead_time = 7  # days
            reorder_point = vel * (lead_time + 3)
            reorder_qty = max(0, int(vel * 30 - stock))  # 30-day supply
            urgency = "critical" if days <= 3 else "warning" if days <= 7 else "ok"
            items.append({
                "sku": sku,
                "name": prod["name"],
                "platform": platform,
                "current_stock": stock,
                "daily_velocity": round(vel, 1),
                "days_remaining": round(days, 1),
                "reorder_point": round(reorder_point, 0),
                "recommended_qty": reorder_qty,
                "urgency": urgency,
                "estimated_revenue_at_risk": round(reorder_qty * BASE_PRICES[sku][platform], 0),
            })
    items.sort(key=lambda x: x["days_remaining"])
    return {"items": items}
