import streamlit as st
import pandas as pd
import sqlite3
from pathlib import Path
import altair as alt

LOG_DB_PATH = Path("sla_logs.db")


def load_logs(limit: int = 200) -> pd.DataFrame:
    if not LOG_DB_PATH.exists():
        return pd.DataFrame()

    conn = sqlite3.connect(LOG_DB_PATH)

    try:
        df = pd.read_sql_query(
            f"""
            SELECT
                id,
                order_id,
                timestamp,
                miss_sla_proba,
                will_miss_sla,
                distance,
                items,
                hub_load,
                traffic,
                weather,
                priority,
                carrier
            FROM predictions
            ORDER BY timestamp DESC
            LIMIT {limit}
            """,
            conn,
        )
    finally:
        conn.close()

    # Parse timestamp
    if "timestamp" in df.columns:
        df["timestamp"] = pd.to_datetime(df["timestamp"])

    return df


def main():
    st.title("SLA Prediction Monitoring Dashboard")

    logs = load_logs()

    if logs.empty:
        st.warning("No logs found. Run predictions to generate data.")
        return

    # Rename for convenience
    logs = logs.copy()
    logs.rename(columns={"miss_sla_proba": "risk"}, inplace=True)

    # KPI Metrics
    total_orders = len(logs)
    high_risk = logs[logs["risk"] > 0.8]
    high_risk_count = len(high_risk)
    high_risk_pct = (high_risk_count / total_orders) * 100
    avg_risk = logs["risk"].mean()

    st.subheader("Key Metrics")
    col1, col2, col3, col4 = st.columns(4)

    col1.metric("Total Orders", total_orders)
    col2.metric("High-Risk Count", high_risk_count)
    col3.metric("High-Risk Percentage", f"{high_risk_pct:.2f}%")
    col4.metric("Average Risk", f"{avg_risk:.2f}")

    # Risk Histogram
    st.subheader("Risk Distribution")
    chart = (
        alt.Chart(logs)
        .mark_bar()
        .encode(
            x=alt.X("risk:Q", bin=alt.Bin(maxbins=20)),
            y="count()",
        )
        .properties(height=300)
    )
    st.altair_chart(chart, use_container_width=True)

    # High risk table
    st.subheader("High-Risk Orders (> 0.8)")
    if high_risk.empty:
        st.info("No high-risk orders in the last batch.")
    else:
        st.dataframe(
            high_risk[
                [
                    "timestamp",
                    "order_id",
                    "risk",
                    "will_miss_sla",
                    "distance",
                    "items",
                    "hub_load",
                    "traffic",
                    "weather",
                    "priority",
                    "carrier",
                ]
            ]
        )

    # All logs table
    st.subheader("Recent Predictions")
    st.dataframe(logs)


if __name__ == "__main__":
    main()
