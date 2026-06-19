"use client";

import { useState, useEffect } from "react";
import { Server, Radio, Users, Settings, Send, Plus, AlertCircle, CheckCircle2, Loader2, FileText, Smartphone } from "lucide-react";

export default function WhatsAppDashboard() {
  // --- GLOBAL STATE ---
  const [activeTab, setActiveTab] = useState("nodes");
  const [vpsIp, setVpsIp] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [globalLog, setGlobalLog] = useState<string[]>(["> System initialized. Awaiting secure connection."]);

  // --- NODE MANAGEMENT STATE ---
  const [nodes, setNodes] = useState<{ id: string; connected: boolean; contacts: number }[]>([]);
  const [newNodeId, setNewNodeId] = useState("");
  const [isChecking, setIsChecking] = useState(false);

  // --- BROADCAST STATE ---
  const [selectedNode, setSelectedNode] = useState("");
  const [targetType, setTargetType] = useState("all");
  const [customNumbers, setCustomNumbers] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const addLog = (msg: string) => {
    setGlobalLog((prev) => [`> ${new Date().toLocaleTimeString()} - ${msg}`, ...prev]);
  };

  // --- API FUNCTIONS ---
  const checkNodeStatus = async (userId: string) => {
    if (!vpsIp) {
      alert("Configure VPS IP in Settings first.");
      return;
    }
    setIsChecking(true);
    addLog(`Checking status for Node: ${userId}...`);
    try {
      const res = await fetch(`http://${vpsIp}:3000/api/status/${userId}`);
      if (!res.ok) throw new Error("Network response was not ok");
      const data = await res.json();
      
      setNodes((prev) => {
        const exists = prev.find((n) => n.id === userId);
        if (exists) {
          return prev.map((n) => (n.id === userId ? { ...n, connected: data.isConnected, contacts: data.contactCount } : n));
        }
        return [...prev, { id: userId, connected: data.isConnected, contacts: data.contactCount }];
      });
      
      addLog(`Node ${userId}: ${data.isConnected ? 'ONLINE' : 'OFFLINE'} | Contacts: ${data.contactCount}`);
      setNewNodeId("");
    } catch (error) {
      addLog(`ERROR: Could not reach VPS at ${vpsIp}:3000`);
      alert("Connection failed. Check if your VPS API is running and IP is correct.");
    }
    setIsChecking(false);
  };

  const executeBroadcast = async () => {
    if (!vpsIp || !apiKey || !selectedNode || !message) {
      alert("Missing required fields. Check configuration, select a node, and write a message.");
      return;
    }
    setIsSending(true);
    addLog(`Initiating broadcast from Node ${selectedNode}...`);
    
    try {
      const res = await fetch(`http://${vpsIp}:3000/api/broadcast`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey,
          userId: selectedNode,
          messageText: message,
          target: targetType === "all" ? "all" : customNumbers,
        }),
      });
      
      const data = await res.json();
      if (data.error) {
        addLog(`API REJECTION: ${data.error}`);
        alert(`Error: ${data.error}`);
      } else {
        addLog(`SUCCESS: ${data.message}`);
        setMessage("");
      }
    } catch (error) {
      addLog("ERROR: Network failure. Could not transmit payload.");
    }
    setIsSending(false);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans flex">
      {/* SIDEBAR */}
      <div className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col hidden md:flex">
        <div className="p-6 border-b border-zinc-800 flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Radio size={20} />
          </div>
          <h1 className="font-bold text-lg tracking-tight">WA Engine</h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => setActiveTab("nodes")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-md transition ${activeTab === "nodes" ? "bg-blue-600 text-white" : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"}`}>
            <Server size={18} /> Manage Nodes
          </button>
          <button onClick={() => setActiveTab("broadcast")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-md transition ${activeTab === "broadcast" ? "bg-blue-600 text-white" : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"}`}>
            <Send size={18} /> Broadcast Center
          </button>
          <button onClick={() => setActiveTab("settings")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-md transition ${activeTab === "settings" ? "bg-blue-600 text-white" : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"}`}>
            <Settings size={18} /> Configuration
          </button>
        </nav>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* MOBILE NAV */}
        <div className="md:hidden flex bg-zinc-900 p-4 border-b border-zinc-800 overflow-x-auto gap-2">
          <button onClick={() => setActiveTab("nodes")} className={`px-4 py-2 rounded text-sm whitespace-nowrap ${activeTab === "nodes" ? "bg-blue-600" : "bg-zinc-800"}`}>Nodes</button>
          <button onClick={() => setActiveTab("broadcast")} className={`px-4 py-2 rounded text-sm whitespace-nowrap ${activeTab === "broadcast" ? "bg-blue-600" : "bg-zinc-800"}`}>Broadcast</button>
          <button onClick={() => setActiveTab("settings")} className={`px-4 py-2 rounded text-sm whitespace-nowrap ${activeTab === "settings" ? "bg-blue-600" : "bg-zinc-800"}`}>Settings</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          
          {/* TAB 1: SETTINGS */}
          {activeTab === "settings" && (
            <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-bold mb-6">Server Configuration</h2>
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">VPS IP Address</label>
                  <input type="text" placeholder="e.g. 64.227.145.228" value={vpsIp} onChange={(e) => setVpsIp(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">API Secret Key</label>
                  <input type="password" placeholder="Enter .env API_KEY" value={apiKey} onChange={(e) => setApiKey(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="p-4 bg-blue-900/20 border border-blue-900/50 rounded-lg flex items-start gap-3 mt-4">
                  <AlertCircle className="text-blue-400 shrink-0 mt-0.5" size={18} />
                  <p className="text-sm text-blue-200/70">Ensure your VPS is running and port 3000 is open. The API Key must perfectly match the one configured in your backend `.env` file.</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: NODES */}
          {activeTab === "nodes" && (
            <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Node Management</h2>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                {/* ADD NODE CARD */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                  <h3 className="text-lg font-medium mb-4 flex items-center gap-2"><Plus size={18} className="text-zinc-400"/> Monitor New Node</h3>
                  <div className="flex gap-2">
                    <input type="text" placeholder="Telegram User ID" value={newNodeId} onChange={(e) => setNewNodeId(e.target.value)} className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <button onClick={() => checkNodeStatus(newNodeId)} disabled={isChecking || !newNodeId} className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 px-6 rounded-lg font-medium transition flex items-center justify-center">
                      {isChecking ? <Loader2 size={18} className="animate-spin" /> : "Check"}
                    </button>
                  </div>
                  <p className="text-xs text-zinc-500 mt-3">Node must be logged into WhatsApp via your Telegram bot before it will display as Online here.</p>
                </div>

                {/* ACTIVE NODES LIST */}
                {nodes.map((node) => (
                  <div key={node.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-zinc-800" />
                    {node.connected && <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />}
                    
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-xs font-mono text-zinc-500">USER ID</p>
                        <h3 className="text-xl font-bold">{node.id}</h3>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 ${node.connected ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"}`}>
                        {node.connected ? <><CheckCircle2 size={12}/> Online</> : <><AlertCircle size={12}/> Offline</>}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-zinc-400 bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                      <div className="flex items-center gap-2"><Users size={16} className="text-blue-400"/> {node.contacts} Contacts Synced</div>
                    </div>
                    <button onClick={() => checkNodeStatus(node.id)} className="mt-4 text-xs text-zinc-500 hover:text-zinc-300 transition w-full text-center p-2 rounded hover:bg-zinc-800">↻ Refresh Status</button>
                  </div>
                ))}

                {nodes.length === 0 && (
                  <div className="bg-zinc-900/50 border border-zinc-800 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center text-zinc-500">
                    <Smartphone size={32} className="mb-3 opacity-50" />
                    <p>No nodes being monitored.</p>
                    <p className="text-sm">Enter a Telegram User ID to link an active WhatsApp session.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: BROADCAST */}
          {activeTab === "broadcast" && (
            <div className="max-w-5xl animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-bold mb-6">Payload Composer</h2>
              
              <div className="grid lg:grid-cols-3 gap-6">
                {/* COLUMN 1: Configuration */}
                <div className="space-y-6">
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                    <h3 className="font-medium mb-3 flex items-center gap-2"><Server size={16} className="text-blue-400"/> 1. Transmission Node</h3>
                    <select value={selectedNode} onChange={(e) => setSelectedNode(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none">
                      <option value="">-- Select Active Node --</option>
                      {nodes.filter(n => n.connected).map(n => (
                        <option key={n.id} value={n.id}>Node: {n.id} ({n.contacts} contacts)</option>
                      ))}
                    </select>
                  </div>

                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                    <h3 className="font-medium mb-3 flex items-center gap-2"><Users size={16} className="text-blue-400"/> 2. Target Audience</h3>
                    <div className="space-y-2">
                      <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${targetType === "all" ? "bg-blue-600/10 border-blue-500/50" : "bg-zinc-950 border-zinc-800 hover:border-zinc-700"}`}>
                        <input type="radio" name="target" checked={targetType === "all"} onChange={() => setTargetType("all")} className="accent-blue-500" />
                        <span className="text-sm">All Synced Contacts</span>
                      </label>
                      <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${targetType === "custom" ? "bg-blue-600/10 border-blue-500/50" : "bg-zinc-950 border-zinc-800 hover:border-zinc-700"}`}>
                        <input type="radio" name="target" checked={targetType === "custom"} onChange={() => setTargetType("custom")} className="accent-blue-500" />
                        <span className="text-sm">Custom Target List</span>
                      </label>
                    </div>
                    {targetType === "custom" && (
                      <textarea placeholder="Paste numbers separated by commas (e.g. 1234567890, 0987654321)" value={customNumbers} onChange={(e) => setCustomNumbers(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 mt-3 h-24 resize-none" />
                    )}
                  </div>
                </div>

                {/* COLUMN 2: Message & Action */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col h-full">
                    <h3 className="font-medium mb-3 flex items-center gap-2"><FileText size={16} className="text-blue-400"/> 3. Message Content</h3>
                    <textarea 
                      placeholder="Draft your broadcast message here..." 
                      value={message} 
                      onChange={(e) => setMessage(e.target.value)} 
                      className="flex-1 w-full bg-zinc-950 border border-zinc-800 rounded-lg p-4 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none min-h-[200px]" 
                    />
                    
                    {/* Note: VPS Backend currently only accepts text via API. Visual placeholder for future expansion */}
                    <div className="mt-4 p-3 border border-zinc-800 border-dashed rounded-lg text-center text-sm text-zinc-500 bg-zinc-950">
                      Media & Document uploads are currently handled directly via the Telegram interface.
                    </div>

                    <button 
                      onClick={executeBroadcast} 
                      disabled={isSending || !selectedNode || !message} 
                      className="mt-6 w-full bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed text-white p-4 rounded-xl font-bold text-lg shadow-lg shadow-blue-900/20 transition-all flex justify-center items-center gap-2"
                    >
                      {isSending ? <><Loader2 className="animate-spin" /> Transmitting to Node...</> : <><Send /> Launch Broadcast</>}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* TERMINAL FOOTER */}
        <div className="h-48 bg-[#0a0a0a] border-t border-zinc-800 p-4 font-mono text-xs overflow-y-auto">
          <div className="text-zinc-500 mb-2">=== ENGINE DIAGNOSTIC TERMINAL ===</div>
          {globalLog.map((log, i) => (
            <div key={i} className={`${log.includes("ERROR") ? "text-rose-400" : log.includes("SUCCESS") ? "text-emerald-400" : "text-zinc-300"} mb-1`}>
              {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
