import asyncio
import random
import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional, Callable, List

logger = logging.getLogger(__name__)

INTERNAL_HOSTS = [f"192.168.1.{i}" for i in range(10, 60)]
EXTERNAL_BENIGN_SERVERS = [
    "172.217.16.206",  # Google
    "151.101.65.140",  # Fastly / Reddit
    "104.244.42.1",    # Twitter / X
    "8.8.8.8",         # DNS
    "1.1.1.1",         # Cloudflare DNS
]
ATTACKER_IPS = [
    "45.142.212.15",
    "185.220.101.44",
    "91.240.118.7",
    "194.26.29.112",
]

COMMON_SERVICES = [
    (80, "TCP", "HTTP"),
    (443, "TCP", "HTTPS"),
    (53, "UDP", "DNS"),
    (22, "TCP", "SSH"),
    (3389, "TCP", "RDP"),
]


class NetworkTrafficSimulator:
    """
    Simulated network flow generator for real-time monitoring.
    Explicitly labels all generated telemetry as SIMULATED traffic.
    """

    def __init__(self):
        self.state: str = "STOPPED"  # STOPPED, RUNNING, PAUSED
        self.flows_per_second: float = 2.0
        self._task: Optional[asyncio.Task] = None
        self._callback: Optional[Callable[[Dict[str, Any]], Any]] = None
        self.total_generated: int = 0
        self.attacks_generated: int = 0

    def set_callback(self, callback: Callable[[Dict[str, Any]], Any]):
        self._callback = callback

    def start(self, flows_per_second: float = 2.0):
        if self.state == "RUNNING":
            return
        self.flows_per_second = max(0.5, min(10.0, flows_per_second))
        self.state = "RUNNING"
        try:
            loop = asyncio.get_running_loop()
            self._task = loop.create_task(self._run_loop())
        except RuntimeError:
            self._task = None
        logger.info(f"Traffic Simulator STARTED at {self.flows_per_second} flows/sec")

    def pause(self):
        if self.state == "RUNNING":
            self.state = "PAUSED"
            logger.info("Traffic Simulator PAUSED")

    def resume(self):
        if self.state == "PAUSED":
            self.state = "RUNNING"
            logger.info("Traffic Simulator RESUMED")

    def stop(self):
        self.state = "STOPPED"
        if self._task and not self._task.done():
            self._task.cancel()
        self._task = None
        logger.info("Traffic Simulator STOPPED")

    def get_status(self) -> Dict[str, Any]:
        return {
            "state": self.state,
            "flows_per_second": self.flows_per_second,
            "total_generated": self.total_generated,
            "attacks_generated": self.attacks_generated,
            "is_simulated": True,
            "engine": "SIMULATED_TRAFFIC_ENGINE",
        }

    async def _run_loop(self):
        try:
            while self.state != "STOPPED":
                if self.state == "RUNNING":
                    flow_data = self.generate_flow()
                    self.total_generated += 1
                    if flow_data["label"] != "Normal":
                        self.attacks_generated += 1

                    if self._callback:
                        try:
                            res = self._callback(flow_data)
                            if asyncio.iscoroutine(res):
                                await res
                        except Exception as cb_err:
                            logger.error(f"Error in live pipeline callback: {cb_err}")

                sleep_time = 1.0 / self.flows_per_second
                await asyncio.sleep(sleep_time)
        except asyncio.CancelledError:
            pass

    def generate_flow(self) -> Dict[str, Any]:
        """Generate a realistic synthetic network flow with scenario distribution."""
        scenario = random.choices(
            ["benign", "ddos", "portscan", "botnet"],
            weights=[0.65, 0.15, 0.12, 0.08],
            k=1
        )[0]

        now_utc = datetime.now(timezone.utc)

        if scenario == "benign":
            svc = random.choice(COMMON_SERVICES)
            src_ip = random.choice(INTERNAL_HOSTS)
            dst_ip = random.choice(EXTERNAL_BENIGN_SERVERS)
            duration = round(random.uniform(0.01, 2.5), 3)
            packets = random.randint(5, 120)
            bytes_count = packets * random.randint(64, 1460)
            label = "Normal"

        elif scenario == "ddos":
            src_ip = random.choice(ATTACKER_IPS)
            dst_ip = random.choice(INTERNAL_HOSTS)
            svc = (80, "TCP", "HTTP")
            duration = round(random.uniform(0.05, 0.8), 3)
            packets = random.randint(15000, 80000)
            bytes_count = packets * random.randint(512, 1400)
            label = "DDoS"

        elif scenario == "portscan":
            src_ip = random.choice(ATTACKER_IPS)
            dst_ip = random.choice(INTERNAL_HOSTS)
            svc = (random.randint(1, 1024), "TCP", "SCAN")
            duration = round(random.uniform(0.001, 0.05), 4)
            packets = random.randint(2, 6)
            bytes_count = packets * 60
            label = "PortScan"

        else:  # botnet
            src_ip = random.choice(INTERNAL_HOSTS)
            dst_ip = random.choice(ATTACKER_IPS)
            svc = (random.choice([6667, 8080, 4444]), "TCP", "C2")
            duration = round(random.uniform(10.0, 60.0), 2)
            packets = random.randint(50, 300)
            bytes_count = packets * random.randint(80, 400)
            label = "Botnet"

        dur = max(0.001, duration)
        return {
            "source_ip": src_ip,
            "destination_ip": dst_ip,
            "source_port": random.randint(1025, 65535),
            "destination_port": svc[0],
            "protocol": svc[1],
            "flow_duration": dur,
            "packet_count": packets,
            "byte_count": bytes_count,
            "packet_rate": round(packets / dur, 2),
            "byte_rate": round(bytes_count / dur, 2),
            "flags": "SYN" if scenario in ["ddos", "portscan"] else "ACK,PSH",
            "label": label,
            "dataset_source": "SIMULATED_TRAFFIC_ENGINE",
            "is_simulated": True,
            "timestamp": now_utc.isoformat(),
        }


# Global singleton simulator instance
simulator = NetworkTrafficSimulator()
