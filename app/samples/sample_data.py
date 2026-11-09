import pandas as pd
import numpy as np

def generate_financial_sample(n_records: int = 150) -> str:
    """Generates financial transaction dataset with realistic anomalies."""
    np.random.seed(42)
    ids = [f"TXN-{10000 + i}" for i in range(n_records)]
    ages = np.random.randint(18, 70, size=n_records).astype(float)
    amounts = np.random.exponential(scale=120, size=n_records) + 15.0
    categories = np.random.choice(["Retail", "Dining", "Groceries", "Electronics", "Travel"], size=n_records, p=[0.4, 0.25, 0.2, 0.1, 0.05])
    balances = np.random.normal(loc=4500, scale=2000, size=n_records)
    balances = np.maximum(balances, 50.0)
    trust_scores = np.random.uniform(0.7, 1.0, size=n_records)

    df = pd.DataFrame({
        "Transaction_ID": ids,
        "Customer_Age": ages,
        "Transaction_Amount": np.round(amounts, 2),
        "Merchant_Category": categories,
        "Account_Balance": np.round(balances, 2),
        "Device_Trust_Score": np.round(trust_scores, 3)
    })

    # Inject specific realistic anomalies
    df.loc[12, "Transaction_Amount"] = 95000.00  # Massive spike
    df.loc[34, "Customer_Age"] = 142.0  # Impossible age
    df.loc[58, "Account_Balance"] = -15200.50  # Huge negative balance
    df.loc[88, "Transaction_Amount"] = 48500.00  # Extreme outlier
    df.loc[105, "Device_Trust_Score"] = 0.01  # Compromised device
    df.loc[120, "Merchant_Category"] = "Illegal_Arms_Exchange"  # Rare anomaly category
    df.loc[135, "Transaction_Amount"] = 82000.00

    return df.to_csv(index=False)

def generate_server_metrics_sample(n_records: int = 160) -> str:
    """Generates cloud server telemetry dataset with realistic performance anomalies."""
    np.random.seed(101)
    nodes = [f"node-prod-0{i%6 + 1}" for i in range(n_records)]
    cpu = np.random.normal(loc=35.0, scale=10.0, size=n_records)
    cpu = np.clip(cpu, 5.0, 75.0)
    memory = np.random.normal(loc=55.0, scale=8.0, size=n_records)
    latency = np.random.gamma(shape=2.0, scale=15.0, size=n_records) + 5.0
    threads = np.random.randint(40, 120, size=n_records).astype(float)
    errors = np.random.poisson(lam=0.3, size=n_records).astype(float)

    df = pd.DataFrame({
        "Server_Node": nodes,
        "CPU_Usage_Pct": np.round(cpu, 1),
        "Memory_Usage_Pct": np.round(memory, 1),
        "Disk_Latency_ms": np.round(latency, 2),
        "Active_Threads": threads,
        "Error_Count": errors
    })

    # Inject realistic system anomalies
    df.loc[18, "CPU_Usage_Pct"] = 99.8
    df.loc[18, "Disk_Latency_ms"] = 2850.40  # Disk bottleneck
    df.loc[45, "Error_Count"] = 84.0  # Sudden error burst
    df.loc[72, "Active_Threads"] = 2400.0  # Thread pool explosion
    df.loc[99, "Memory_Usage_Pct"] = 99.4
    df.loc[140, "Disk_Latency_ms"] = 1950.00

    return df.to_csv(index=False)

def generate_iot_sensor_sample(n_records: int = 150) -> str:
    """Generates industrial turbine IoT sensor dataset."""
    np.random.seed(77)
    sensor_ids = [f"SENSOR-{i%8 + 1:03d}" for i in range(n_records)]
    temp = np.random.normal(loc=65.0, scale=4.0, size=n_records)
    vibration = np.random.normal(loc=25.0, scale=3.0, size=n_records)
    pressure = np.random.normal(loc=120.0, scale=6.0, size=n_records)
    voltage = np.random.normal(loc=230.0, scale=2.5, size=n_records)

    df = pd.DataFrame({
        "Sensor_ID": sensor_ids,
        "Temperature_C": np.round(temp, 1),
        "Vibration_Hz": np.round(vibration, 2),
        "Pressure_PSI": np.round(pressure, 1),
        "Voltage_V": np.round(voltage, 1)
    })

    # Inject sensor anomalies
    df.loc[15, "Temperature_C"] = 188.5  # Critical overheating
    df.loc[52, "Vibration_Hz"] = 98.40  # Bearing failure vibration
    df.loc[84, "Pressure_PSI"] = 12.0  # Rapid depressurization
    df.loc[118, "Voltage_V"] = 415.0  # Voltage surge
    df.loc[132, "Temperature_C"] = 175.2

    return df.to_csv(index=False)

