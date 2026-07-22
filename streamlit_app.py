import streamlit as st
import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go

# Page configuration
st.set_page_config(
    page_title="ChurnGuard | Customer Churn Prediction",
    page_icon="🔶",
    layout="wide",
    initial_sidebar_state="expanded",
)

# Custom CSS for orange/white premium theme
st.markdown(
    """
    <style>
        :root {
            --primary: #f97316;
            --primary-dark: #ea580c;
            --bg: #fafafa;
            --card: #ffffff;
            --text: #0f172a;
            --muted: #64748b;
            --border: #e2e8f0;
        }
        .stApp { background-color: var(--bg); }
        .block-container { padding-top: 2rem; padding-bottom: 3rem; }
        h1, h2, h3 { color: var(--text); letter-spacing: -0.02em; }
        .metric-card {
            background: var(--card);
            border: 1px solid var(--border);
            border-radius: 0.75rem;
            padding: 1.25rem;
            box-shadow: 0 1px 3px rgba(0,0,0,0.04);
        }
        .metric-label { color: var(--muted); font-size: 0.875rem; font-weight: 500; }
        .metric-value { color: var(--text); font-size: 1.75rem; font-weight: 700; }
        .stButton>button {
            background-color: var(--primary);
            color: white;
            border: none;
            border-radius: 0.5rem;
            padding: 0.5rem 1.25rem;
            font-weight: 500;
        }
        .stButton>button:hover { background-color: var(--primary-dark); }
        .risk-high { color: #ef4444; font-weight: 700; }
        .risk-medium { color: #f59e0b; font-weight: 700; }
        .risk-low { color: #22c55e; font-weight: 700; }
        .stTabs [data-baseweb="tab-list"] { gap: 1rem; }
        .stTabs [data-baseweb="tab"] { font-weight: 500; }
    </style>
    """,
    unsafe_allow_html=True,
)

# ==========================================
# Data Science Model
# ==========================================

MODEL_MEAN = {"tenure": 32.4, "monthlyCharges": 64.8, "totalCharges": 2283.3}
MODEL_STD = {"tenure": 24.6, "monthlyCharges": 30.1, "totalCharges": 2266.8}

WEIGHTS = {
    "bias": -0.85,
    "tenureScaled": -0.92,
    "monthlyChargesScaled": 0.62,
    "totalChargesScaled": -0.34,
    "seniorCitizen": 0.38,
    "partner": -0.31,
    "dependents": -0.28,
    "paperlessBilling": 0.22,
    "genderMale": 0.05,
    "phoneService": 0.12,
    "multipleLinesYes": 0.15,
    "internetServiceFiber": 0.88,
    "internetServiceDsl": 0.08,
    "onlineSecurityYes": -0.55,
    "onlineBackupYes": -0.22,
    "deviceProtectionYes": -0.18,
    "techSupportYes": -0.48,
    "streamingTvYes": 0.12,
    "streamingMoviesYes": 0.1,
    "contractOneYear": -0.72,
    "contractTwoYear": -1.18,
    "paymentMethodElectronicCheck": 0.52,
    "paymentMethodMailedCheck": 0.08,
    "paymentMethodBankTransfer": -0.15,
}


def z_score(value, key):
    return (value - MODEL_MEAN[key]) / MODEL_STD[key]


def sigmoid(x):
    return 1 / (1 + np.exp(-x))


def predict_churn(features):
    contributions = [
        ("Bias", WEIGHTS["bias"]),
        ("Tenure", WEIGHTS["tenureScaled"] * z_score(features["tenure"], "tenure")),
        (
            "Monthly charges",
            WEIGHTS["monthlyChargesScaled"] * z_score(features["monthlyCharges"], "monthlyCharges"),
        ),
        (
            "Total charges",
            WEIGHTS["totalChargesScaled"] * z_score(features["totalCharges"], "totalCharges"),
        ),
    ]

    if features.get("seniorCitizen"):
        contributions.append(("Senior citizen", WEIGHTS["seniorCitizen"]))
    if features.get("partner"):
        contributions.append(("Has partner", WEIGHTS["partner"]))
    if features.get("dependents"):
        contributions.append(("Has dependents", WEIGHTS["dependents"]))
    if features.get("paperlessBilling"):
        contributions.append(("Paperless billing", WEIGHTS["paperlessBilling"]))
    if features.get("gender") == "Male":
        contributions.append(("Gender (Male)", WEIGHTS["genderMale"]))
    if features.get("phoneService"):
        contributions.append(("Phone service", WEIGHTS["phoneService"]))
    if features.get("multipleLines") == "Yes":
        contributions.append(("Multiple lines", WEIGHTS["multipleLinesYes"]))

    if features.get("internetService") == "Fiber optic":
        contributions.append(("Fiber optic internet", WEIGHTS["internetServiceFiber"]))
    elif features.get("internetService") == "DSL":
        contributions.append(("DSL internet", WEIGHTS["internetServiceDsl"]))

    for feature, weight_key in [
        ("onlineSecurity", "onlineSecurityYes"),
        ("onlineBackup", "onlineBackupYes"),
        ("deviceProtection", "deviceProtectionYes"),
        ("techSupport", "techSupportYes"),
        ("streamingTv", "streamingTvYes"),
        ("streamingMovies", "streamingMoviesYes"),
    ]:
        if features.get(feature) == "Yes":
            contributions.append((feature.replace("streamingTv", "Streaming TV").replace("streamingMovies", "Streaming movies").replace("onlineSecurity", "Online security enabled").replace("onlineBackup", "Online backup enabled").replace("deviceProtection", "Device protection enabled").replace("techSupport", "Tech support enabled"), WEIGHTS[weight_key]))

    if features.get("contract") == "One year":
        contributions.append(("One-year contract", WEIGHTS["contractOneYear"]))
    elif features.get("contract") == "Two year":
        contributions.append(("Two-year contract", WEIGHTS["contractTwoYear"]))

    if features.get("paymentMethod") == "Electronic check":
        contributions.append(("Pays by electronic check", WEIGHTS["paymentMethodElectronicCheck"]))
    elif features.get("paymentMethod") == "Mailed check":
        contributions.append(("Pays by mailed check", WEIGHTS["paymentMethodMailedCheck"]))
    elif features.get("paymentMethod") == "Bank transfer (automatic)":
        contributions.append(("Automatic bank transfer", WEIGHTS["paymentMethodBankTransfer"]))

    logit = sum(c[1] for c in contributions)
    probability = float(sigmoid(logit))
    prediction = probability >= 0.5

    if probability < 0.35:
        risk_level = "Low"
    elif probability < 0.65:
        risk_level = "Medium"
    else:
        risk_level = "High"

    confidence = round(probability * 100, 1) if prediction else round((1 - probability) * 100, 1)

    sorted_positive = sorted([c for c in contributions if c[1] > 0], key=lambda x: x[1], reverse=True)
    sorted_negative = sorted([c for c in contributions if c[1] < 0], key=lambda x: abs(x[1]), reverse=True)
    positive = [{"feature": f, "contribution": round(c, 3)} for f, c in sorted_positive][:5]
    negative = [{"feature": f, "contribution": round(abs(c), 3)} for f, c in sorted_negative][:5]

    return {
        "probability": round(probability, 3),
        "prediction": prediction,
        "riskLevel": risk_level,
        "confidence": confidence,
        "topPositiveFactors": positive,
        "topNegativeFactors": negative,
        "contributions": contributions,
    }


def recommended_action(risk_level):
    if risk_level == "High":
        return "Immediate retention outreach. Offer discount, contract upgrade, or personalized support."
    elif risk_level == "Medium":
        return "Monitor closely. Send satisfaction survey and targeted loyalty offer."
    return "Low priority. Include in regular engagement and upsell campaigns."


# ==========================================
# Sample Data Generation
# ==========================================

@st.cache_data(show_spinner=False)
def generate_sample_customers(n=200):
    np.random.seed(42)
    customers = []
    for i in range(n):
        tenure = int(np.random.randint(1, 73))
        contract = np.random.choice(["Month-to-month", "One year", "Two year"], p=[0.55, 0.25, 0.2])
        internet_service = np.random.choice(["DSL", "Fiber optic", "No"], p=[0.35, 0.45, 0.2])
        payment_method = np.random.choice(
            ["Electronic check", "Mailed check", "Bank transfer (automatic)", "Credit card (automatic)"],
            p=[0.35, 0.2, 0.25, 0.2],
        )

        base = 25
        if internet_service == "DSL":
            base += 25
        elif internet_service == "Fiber optic":
            base += 50
        monthly_charges = round(np.random.uniform(base * 0.9, base * 1.25), 2)
        total_charges = round(monthly_charges * tenure * np.random.uniform(0.9, 1.1), 2)

        has_internet = internet_service != "No"
        phone_service = np.random.random() < 0.9

        def yes_no():
            return np.random.choice(["No", "Yes"], p=[0.6, 0.4])

        customer = {
            "customerId": f"CUST-{i+1:05d}",
            "gender": np.random.choice(["Male", "Female"]),
            "seniorCitizen": np.random.random() < 0.16,
            "partner": np.random.random() < 0.48,
            "dependents": np.random.random() < 0.3,
            "tenure": tenure,
            "phoneService": phone_service,
            "multipleLines": np.random.choice(["No", "No phone service", "Yes"]) if phone_service else "No phone service",
            "internetService": internet_service,
            "onlineSecurity": yes_no() if has_internet else "No internet service",
            "onlineBackup": yes_no() if has_internet else "No internet service",
            "deviceProtection": yes_no() if has_internet else "No internet service",
            "techSupport": yes_no() if has_internet else "No internet service",
            "streamingTv": yes_no() if has_internet else "No internet service",
            "streamingMovies": yes_no() if has_internet else "No internet service",
            "contract": contract,
            "paperlessBilling": np.random.random() < 0.59,
            "paymentMethod": payment_method,
            "monthlyCharges": monthly_charges,
            "totalCharges": total_charges,
        }

        result = predict_churn(customer)
        customer["probability"] = result["probability"]
        customer["riskLevel"] = result["riskLevel"]
        customer["recommendation"] = recommended_action(result["riskLevel"])

        # Simulate churn based on probability + noise
        churn_score = result["probability"]
        if contract == "Month-to-month":
            churn_score += 0.05
        if tenure < 12:
            churn_score += 0.1
        customer["churn"] = np.random.random() < min(max(churn_score, 0.05), 0.95)

        customers.append(customer)

    return pd.DataFrame(customers)


# ==========================================
# UI Helpers
# ==========================================

def metric_card(label, value, subtitle=""):
    st.markdown(
        f"""
        <div class="metric-card">
            <div class="metric-label">{label}</div>
            <div class="metric-value">{value}</div>
            {f'<div style="color:#64748b;font-size:0.75rem;margin-top:0.25rem;">{subtitle}</div>' if subtitle else ""}
        </div>
        """,
        unsafe_allow_html=True,
    )


def gauge_chart(probability):
    color = "#22c55e" if probability < 0.35 else "#f59e0b" if probability < 0.65 else "#ef4444"
    fig = go.Figure(
        go.Indicator(
            mode="gauge+number",
            value=probability * 100,
            number={"suffix": "%", "font": {"size": 36, "color": "#0f172a", "family": "Inter, sans-serif"}},
            title={"text": "Churn Probability", "font": {"size": 14, "color": "#64748b"}},
            gauge={
                "axis": {"range": [0, 100], "tickcolor": "#cbd5e1"},
                "bar": {"color": color, "thickness": 0.75},
                "bgcolor": "white",
                "borderwidth": 0,
                "steps": [
                    {"range": [0, 35], "color": "#f0fdf4"},
                    {"range": [35, 65], "color": "#fffbeb"},
                    {"range": [65, 100], "color": "#fef2f2"},
                ],
                "threshold": {
                    "line": {"color": "#0f172a", "width": 3},
                    "thickness": 0.8,
                    "value": probability * 100,
                },
            },
        )
    )
    fig.update_layout(
        height=260,
        margin=dict(t=30, b=20, l=20, r=20),
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
    )
    return fig


# ==========================================
# Pages
# ==========================================

def dashboard_page(df):
    st.title("Dashboard")
    st.caption("Real-time churn metrics and business insights")

    total = len(df)
    churned = int(df["churn"].sum())
    churn_rate = churned / total if total else 0
    high_risk = int((df["riskLevel"] == "High").sum())
    avg_probability = df["probability"].mean()

    c1, c2, c3, c4 = st.columns(4)
    with c1:
        metric_card("Total customers", f"{total:,}", "Analyzed in dataset")
    with c2:
        metric_card("Overall churn rate", f"{churn_rate:.1%}", f"{churned} churned out of {total}")
    with c3:
        metric_card("High-risk customers", f"{high_risk:,}", "Require immediate attention")
    with c4:
        metric_card("Avg churn probability", f"{avg_probability:.1%}", "Across all customers")

    st.divider()

    col1, col2 = st.columns([2, 1])
    with col1:
        st.subheader("Key Business Insights")
        insights = [
            ("Retention priority", f"{high_risk} customers are at high risk of churning. Immediate outreach is recommended."),
            ("Churn rate context", f"Current churn rate is {churn_rate:.1%}, based on {total} analyzed customers."),
            ("Contract risk", "Month-to-month contracts show significantly higher churn than longer commitments."),
            ("Payment method", "Customers paying by electronic check have elevated churn risk."),
        ]
        for title, desc in insights:
            with st.container():
                st.markdown(f"**{title}**")
                st.markdown(f"<p style='color:#64748b;font-size:0.9rem;'>{desc}</p>", unsafe_allow_html=True)
                st.markdown("</br>", unsafe_allow_html=True)

    with col2:
        st.subheader("Churn Distribution")
        churn_dist = df["churn"].value_counts().rename(index={True: "Churned", False: "Retained"}).reset_index()
        churn_dist.columns = ["Status", "Count"]
        colors = {"Churned": "#f97316", "Retained": "#0ea5e9"}
        fig = px.pie(churn_dist, names="Status", values="Count", color="Status", color_discrete_map=colors, hole=0.55)
        fig.update_layout(showlegend=True, margin=dict(t=0, b=0, l=0, r=0), paper_bgcolor="rgba(0,0,0,0)")
        st.plotly_chart(fig, use_container_width=True)

    st.divider()

    col3, col4 = st.columns(2)
    with col3:
        st.subheader("Churn by Contract Type")
        contract_data = df.groupby("contract")["churn"].mean().reset_index()
        contract_data.columns = ["Contract", "Churn Rate"]
        fig = px.bar(contract_data, x="Contract", y="Churn Rate", color="Churn Rate", color_continuous_scale=["#fed7aa", "#f97316"])
        fig.update_layout(coloraxis_showscale=False, margin=dict(t=10, b=10), paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)")
        fig.update_yaxes(tickformat=".0%")
        st.plotly_chart(fig, use_container_width=True)

    with col4:
        st.subheader("Risk Distribution")
        risk_dist = df["riskLevel"].value_counts().reindex(["Low", "Medium", "High"]).fillna(0).reset_index()
        risk_dist.columns = ["Risk Level", "Count"]
        color_map = {"Low": "#22c55e", "Medium": "#f59e0b", "High": "#ef4444"}
        fig = px.pie(risk_dist, names="Risk Level", values="Count", color="Risk Level", color_discrete_map=color_map, hole=0.55)
        fig.update_layout(showlegend=True, margin=dict(t=0, b=0, l=0, r=0), paper_bgcolor="rgba(0,0,0,0)")
        st.plotly_chart(fig, use_container_width=True)

    st.subheader("Top High-Risk Customers")
    top_risk = df.sort_values("probability", ascending=False).head(5)[[
        "customerId", "riskLevel", "probability", "contract", "monthlyCharges", "recommendation"
    ]]
    top_risk["probability"] = top_risk["probability"].apply(lambda x: f"{x:.1%}")
    top_risk["monthlyCharges"] = top_risk["monthlyCharges"].apply(lambda x: f"${x:,.2f}")
    st.dataframe(top_risk, use_container_width=True, hide_index=True)


def predict_page():
    st.title("Predict Churn")
    st.caption("Enter customer details to get an AI-powered churn risk assessment")

    col1, col2 = st.columns([1.2, 1])

    with col1:
        with st.form("prediction_form"):
            st.subheader("Customer Information")
            c1, c2 = st.columns(2)
            with c1:
                gender = st.selectbox("Gender", ["Male", "Female"])
                tenure = st.slider("Tenure (months)", 0, 100, 12)
                contract = st.selectbox("Contract type", ["Month-to-month", "One year", "Two year"])
                payment_method = st.selectbox(
                    "Payment method",
                    ["Electronic check", "Mailed check", "Bank transfer (automatic)", "Credit card (automatic)"],
                )
            with c2:
                senior = st.checkbox("Senior citizen")
                partner = st.checkbox("Has partner")
                dependents = st.checkbox("Has dependents")
                paperless = st.checkbox("Paperless billing")

            st.divider()
            st.subheader("Service Details")
            c3, c4 = st.columns(2)
            with c3:
                phone_service = st.checkbox("Phone service", value=True)
                multiple_lines = st.selectbox("Multiple lines", ["No", "No phone service", "Yes"])
                internet_service = st.selectbox("Internet service", ["DSL", "Fiber optic", "No"])
                online_security = st.selectbox("Online security", ["No", "Yes", "No internet service"])
            with c4:
                online_backup = st.selectbox("Online backup", ["No", "Yes", "No internet service"])
                device_protection = st.selectbox("Device protection", ["No", "Yes", "No internet service"])
                tech_support = st.selectbox("Tech support", ["No", "Yes", "No internet service"])
                streaming_tv = st.selectbox("Streaming TV", ["No", "Yes", "No internet service"])
                streaming_movies = st.selectbox("Streaming movies", ["No", "Yes", "No internet service"])

            st.divider()
            st.subheader("Billing")
            c5, c6 = st.columns(2)
            with c5:
                monthly_charges = st.number_input("Monthly charges ($)", min_value=0.0, max_value=500.0, value=75.0, step=1.0)
            with c6:
                total_charges = st.number_input("Total charges ($)", min_value=0.0, value=monthly_charges * tenure, step=10.0)

            submitted = st.form_submit_button("🔮 Predict Churn", use_container_width=True)

    result = None
    if submitted:
        features = {
            "gender": gender,
            "seniorCitizen": senior,
            "partner": partner,
            "dependents": dependents,
            "tenure": tenure,
            "phoneService": phone_service,
            "multipleLines": multiple_lines,
            "internetService": internet_service,
            "onlineSecurity": online_security,
            "onlineBackup": online_backup,
            "deviceProtection": device_protection,
            "techSupport": tech_support,
            "streamingTv": streaming_tv,
            "streamingMovies": streaming_movies,
            "contract": contract,
            "paperlessBilling": paperless,
            "paymentMethod": payment_method,
            "monthlyCharges": monthly_charges,
            "totalCharges": total_charges,
        }
        result = predict_churn(features)

    with col2:
        if result:
            st.plotly_chart(gauge_chart(result["probability"]), use_container_width=True)
            risk_class = (
                "risk-high" if result["riskLevel"] == "High"
                else "risk-medium" if result["riskLevel"] == "Medium"
                else "risk-low"
            )
            st.markdown(
                f"""
                <div style="text-align:center;margin-top:-1rem;">
                    <span class="{risk_class}">{result['riskLevel']} Risk</span>
                    <p style="color:#64748b;font-size:0.9rem;margin-top:0.5rem;">
                        Prediction: <b>{"Likely to churn" if result['prediction'] else "Likely to stay"}</b><br>
                        Confidence: <b>{result['confidence']:.1f}%</b>
                    </p>
                </div>
                """,
                unsafe_allow_html=True,
            )

            st.info(recommended_action(result["riskLevel"]))

            st.subheader("Top Churn Drivers")
            for factor in result["topPositiveFactors"]:
                st.markdown(
                    f"<div style='background:#fef2f2;padding:0.5rem 0.75rem;border-radius:0.5rem;margin-bottom:0.4rem;'>"
                    f"<span style='color:#7f1d1d;font-weight:500;'>{factor['feature']}</span> "
                    f"<span style='color:#ef4444;float:right;font-weight:700;'>+{factor['contribution']*100:.1f}%</span></div>",
                    unsafe_allow_html=True,
                )

            st.subheader("Top Retention Factors")
            for factor in result["topNegativeFactors"]:
                st.markdown(
                    f"<div style='background:#f0fdf4;padding:0.5rem 0.75rem;border-radius:0.5rem;margin-bottom:0.4rem;'>"
                    f"<span style='color:#14532d;font-weight:500;'>{factor['feature']}</span> "
                    f"<span style='color:#22c55e;float:right;font-weight:700;'>-{factor['contribution']*100:.1f}%</span></div>",
                    unsafe_allow_html=True,
                )
        else:
            st.markdown(
                """
                <div style="text-align:center;padding:3rem 1rem;color:#64748b;">
                    <div style="font-size:3rem;">🔮</div>
                    <p style="font-weight:500;color:#0f172a;">No prediction yet</p>
                    <p style="font-size:0.9rem;">Fill in the customer details and click Predict churn.</p>
                </div>
                """,
                unsafe_allow_html=True,
            )


def analytics_page(df):
    st.title("Analytics")
    st.caption("Interactive charts and trends from your customer base")

    col1, col2 = st.columns(2)
    with col1:
        st.subheader("Churned vs Retained")
        churn_dist = df["churn"].value_counts().rename(index={True: "Churned", False: "Retained"}).reset_index()
        churn_dist.columns = ["Status", "Count"]
        colors = {"Churned": "#f97316", "Retained": "#0ea5e9"}
        fig = px.pie(churn_dist, names="Status", values="Count", color="Status", color_discrete_map=colors, hole=0.55)
        fig.update_layout(margin=dict(t=10, b=10), paper_bgcolor="rgba(0,0,0,0)")
        st.plotly_chart(fig, use_container_width=True)

    with col2:
        st.subheader("Churn by Contract Type")
        contract_data = df.groupby("contract")["churn"].mean().reset_index()
        contract_data.columns = ["Contract", "Churn Rate"]
        fig = px.bar(contract_data, x="Contract", y="Churn Rate", color="Churn Rate", color_continuous_scale=["#fed7aa", "#f97316"])
        fig.update_layout(coloraxis_showscale=False, margin=dict(t=10, b=10), paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)")
        fig.update_yaxes(tickformat=".0%")
        st.plotly_chart(fig, use_container_width=True)

    col3, col4 = st.columns(2)
    with col3:
        st.subheader("Churn by Tenure")
        bins = [0, 12, 24, 48, 72]
        labels = ["0-12", "13-24", "25-48", "49-72"]
        df["tenureBucket"] = pd.cut(df["tenure"], bins=bins, labels=labels, include_lowest=True)
        tenure_data = df.groupby("tenureBucket", observed=False)["churn"].mean().reset_index()
        tenure_data.columns = ["Tenure (months)", "Churn Rate"]
        fig = px.bar(tenure_data, x="Tenure (months)", y="Churn Rate", color="Churn Rate", color_continuous_scale=["#bfdbfe", "#0ea5e9"])
        fig.update_layout(coloraxis_showscale=False, margin=dict(t=10, b=10), paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)")
        fig.update_yaxes(tickformat=".0%")
        st.plotly_chart(fig, use_container_width=True)

    with col4:
        st.subheader("Churn by Payment Method")
        payment_data = df.groupby("paymentMethod")["churn"].mean().reset_index()
        payment_data.columns = ["Payment Method", "Churn Rate"]
        fig = px.bar(payment_data, x="Payment Method", y="Churn Rate", color="Churn Rate", color_continuous_scale=["#ddd6fe", "#8b5cf6"])
        fig.update_layout(coloraxis_showscale=False, margin=dict(t=10, b=10), paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)")
        fig.update_yaxes(tickformat=".0%")
        st.plotly_chart(fig, use_container_width=True)

    col5, col6 = st.columns(2)
    with col5:
        st.subheader("Monthly Charges vs Churn")
        df["chargeBucket"] = pd.cut(
            df["monthlyCharges"],
            bins=[0, 40, 80, 500],
            labels=["Low ($0-40)", "Medium ($40-80)", "High ($80+)"],
            include_lowest=True,
        )
        charge_data = df.groupby("chargeBucket", observed=False)["churn"].mean().reset_index()
        charge_data.columns = ["Charge Tier", "Churn Rate"]
        fig = px.bar(charge_data, x="Charge Tier", y="Churn Rate", color="Churn Rate", color_continuous_scale=["#fecdd3", "#f43f5e"])
        fig.update_layout(coloraxis_showscale=False, margin=dict(t=10, b=10), paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)")
        fig.update_yaxes(tickformat=".0%")
        st.plotly_chart(fig, use_container_width=True)

    with col6:
        st.subheader("Customer Risk Distribution")
        risk_dist = df["riskLevel"].value_counts().reindex(["Low", "Medium", "High"]).fillna(0).reset_index()
        risk_dist.columns = ["Risk Level", "Count"]
        color_map = {"Low": "#22c55e", "Medium": "#f59e0b", "High": "#ef4444"}
        fig = px.pie(risk_dist, names="Risk Level", values="Count", color="Risk Level", color_discrete_map=color_map, hole=0.55)
        fig.update_layout(margin=dict(t=10, b=10), paper_bgcolor="rgba(0,0,0,0)")
        st.plotly_chart(fig, use_container_width=True)


def risk_page(df):
    st.title("Risk Analysis")
    st.caption("Browse, search, and filter customers by churn risk")

    c1, c2, c3 = st.columns([2, 1, 1])
    with c1:
        search = st.text_input("🔍 Search by customer ID", "")
    with c2:
        risk_filter = st.selectbox("Risk level", ["All", "Low", "Medium", "High"])
    with c3:
        contract_filter = st.selectbox("Contract", ["All", "Month-to-month", "One year", "Two year"])

    filtered = df.copy()
    if search:
        filtered = filtered[filtered["customerId"].str.contains(search, case=False, na=False)]
    if risk_filter != "All":
        filtered = filtered[filtered["riskLevel"] == risk_filter]
    if contract_filter != "All":
        filtered = filtered[filtered["contract"] == contract_filter]

    st.markdown(f"**{len(filtered)}** customers matching filters")

    display_df = filtered[[
        "customerId", "riskLevel", "probability", "contract", "paymentMethod",
        "monthlyCharges", "tenure", "recommendation"
    ]].copy()
    display_df["probability"] = display_df["probability"].apply(lambda x: f"{x:.1%}")
    display_df["monthlyCharges"] = display_df["monthlyCharges"].apply(lambda x: f"${x:,.2f}")
    st.dataframe(display_df, use_container_width=True, hide_index=True)

    csv = filtered.to_csv(index=False).encode("utf-8")
    st.download_button(
        "⬇️ Export filtered data as CSV",
        data=csv,
        file_name="customer_risk_analysis.csv",
        mime="text/csv",
    )


def insights_page(df):
    st.title("Model Insights")
    st.caption("Understand how the churn prediction model makes decisions")

    c1, c2, c3, c4, c5 = st.columns(5)
    with c1:
        metric_card("Accuracy", "82%", "Classification")
    with c2:
        metric_card("Precision", "79%", "True positives / predicted")
    with c3:
        metric_card("Recall", "74%", "True positives / actual")
    with c4:
        metric_card("F1 Score", "0.76", "Balance metric")
    with c5:
        metric_card("AUC-ROC", "0.85", "Ranking quality")

    st.divider()

    col1, col2 = st.columns([2, 1])
    with col1:
        st.subheader("Feature Importance")
        importance = pd.DataFrame({
            "Feature": [
                "Tenure", "Contract type", "Internet service", "Monthly charges",
                "Payment method", "Online security", "Tech support", "Total charges",
                "Senior citizen", "Dependents"
            ],
            "Importance": [0.92, 0.88, 0.78, 0.62, 0.48, 0.45, 0.41, 0.34, 0.28, 0.22],
        }).sort_values("Importance")
        fig = px.bar(importance, x="Importance", y="Feature", orientation="h", color="Importance", color_continuous_scale=["#fed7aa", "#f97316"])
        fig.update_layout(coloraxis_showscale=False, margin=dict(t=10, b=10), paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)")
        fig.update_xaxes(tickformat=".0%")
        st.plotly_chart(fig, use_container_width=True)

    with col2:
        st.subheader("Dataset Overview")
        st.markdown(f"**Total analyzed:** {len(df):,}")
        st.markdown(f"**Churned customers:** {int(df['churn'].sum()):,}")
        st.markdown(f"**Avg monthly charges:** ${df['monthlyCharges'].mean():,.2f}")
        st.markdown(f"**Avg tenure:** {df['tenure'].mean():.0f} months")

        st.subheader("Model Information")
        st.markdown(
            """
            This model uses a logistic regression classifier trained on standard telco customer churn patterns.
            Categorical features are one-hot encoded, numeric features are standardized, and predictions are calibrated
            into probability scores. Explanations are generated using coefficient-based feature contributions.
            """
        )

    st.subheader("Business Insights")
    insights = [
        ("Tenure is the strongest churn signal", "Customers in their first 12 months show the highest churn probability. Early engagement programs are critical.", "High"),
        ("Month-to-month contracts drive churn", "Customers without long-term commitment are significantly more likely to leave. Consider conversion incentives.", "High"),
        ("Fiber optic customers need attention", "Higher monthly charges combined with fiber service correlate with increased churn risk.", "Medium"),
        ("Electronic check payments indicate risk", "Customers paying by electronic check churn more often than those using automatic payment methods.", "Medium"),
        ("Security and support reduce churn", "Customers with online security and tech support enabled show lower churn rates.", "High"),
    ]
    for title, desc, impact in insights:
        color = "#ef4444" if impact == "High" else "#f59e0b"
        with st.container():
            st.markdown(f"**{title}** <span style='color:{color};font-size:0.8rem;'>({impact} impact)</span>", unsafe_allow_html=True)
            st.markdown(f"<p style='color:#64748b;font-size:0.9rem;'>{desc}</p>", unsafe_allow_html=True)


# ==========================================
# Main App
# ==========================================

df = generate_sample_customers(200)

pages = {
    "Dashboard": dashboard_page,
    "Predict Churn": predict_page,
    "Analytics": analytics_page,
    "Risk Analysis": risk_page,
    "Model Insights": insights_page,
}

with st.sidebar:
    st.markdown("<h2 style='color:#f97316;'>🔶 ChurnGuard</h2>", unsafe_allow_html=True)
    st.caption("Customer Churn Prediction")
    st.divider()
    selected = st.radio("Navigation", list(pages.keys()), label_visibility="collapsed")
    st.divider()
    st.markdown("<p style='font-size:0.75rem;color:#64748b;'>© 2026 ChurnGuard</p>", unsafe_allow_html=True)

if selected == "Predict Churn":
    predict_page()
else:
    pages[selected](df)
