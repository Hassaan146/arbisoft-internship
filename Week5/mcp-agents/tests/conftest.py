import sys
from pathlib import Path

# Make the mcp-agents package importable (mcp_server, ra_bridge, tracing, ...).
# ra_bridge in turn puts Week4/research-agent on sys.path.
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
