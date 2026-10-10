import React, { useEffect, useRef, useState, useMemo } from 'react';
import { ShieldAlert, Globe, User, Monitor, Terminal, Activity, FileText, Crosshair, Link, Zap } from 'lucide-react';

const ICON_MAP = {
  url: Globe,
  domain: Globe,
  user: User,
  person: User,
  account: User,
  device: Monitor,
  ip: Terminal,
  incident: ShieldAlert,
  evidence: FileText,
  default: Activity
};

const COLOR_MAP = {
  url: '#38bdf8',
  domain: '#38bdf8',
  user: '#c084fc',
  person: '#c084fc',
  device: '#94a3b8',
  ip: '#f59e0b',
  incident: '#ef4444',
  evidence: '#43e6a3',
  default: '#64748b'
};

function getRiskColor(score) {
  if (score >= 0.85) return '#ff3b5f';
  if (score >= 0.70) return '#f97316';
  if (score >= 0.40) return '#f59e0b';
  return '#43e6a3';
}

export default function AttackGraph({ incident }) {
  const containerRef = useRef(null);
  
  // Transform incident data into nodes and edges
  const { nodes, edges } = useMemo(() => {
    if (!incident) return { nodes: [], edges: [] };
    
    const nodeMap = new Map();
    const edges = [];
    
    // Add Incident node
    nodeMap.set(incident.id, {
      id: incident.id,
      label: incident.title || 'Incident',
      type: 'incident',
      data: incident
    });
    
    // Add Entity nodes
    if (incident.entities) {
      incident.entities.forEach(e => {
        nodeMap.set(e.id, {
          id: e.id,
          label: e.name || e.id,
          type: e.type,
          data: e
        });
      });
    }
    
    // Add Evidence nodes
    if (incident.evidence) {
      incident.evidence.forEach(ev => {
        nodeMap.set(ev.id, {
          id: ev.id,
          label: ev.type || 'Evidence',
          type: 'evidence',
          data: ev
        });
        // Add edge from incident to evidence
        edges.push({ source: incident.id, target: ev.id, label: 'HAS_EVIDENCE' });
      });
    }
    
    // Add Relationships from correlation groups
    if (incident.correlation_groups) {
      incident.correlation_groups.forEach(group => {
        if (group.relationships) {
          group.relationships.forEach(rel => {
            // Ensure nodes exist (they might be missing if incomplete data)
            if (nodeMap.has(rel.source_id) && nodeMap.has(rel.target_id)) {
              edges.push({
                source: rel.source_id,
                target: rel.target_id,
                label: rel.relation
              });
            }
          });
        }
      });
    }

    // Add inferred edges if no explicit relationships
    if (edges.length === (incident.evidence ? incident.evidence.length : 0) && incident.entities && incident.evidence) {
      // Connect evidence to entities if no explicit graph edges exist
      incident.evidence.forEach(ev => {
        if (ev.entity_refs) {
          ev.entity_refs.forEach(ref => {
            if (nodeMap.has(ref)) {
              edges.push({ source: ev.id, target: ref, label: 'OBSERVED_ON' });
            }
          });
        }
      });
    }
    
    return { nodes: Array.from(nodeMap.values()), edges };
  }, [incident]);

  const [positions, setPositions] = useState({});
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isDraggingNode, setIsDraggingNode] = useState(null);
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredEdge, setHoveredEdge] = useState(null);
  
  // Force Directed Graph Simulation
  useEffect(() => {
    if (nodes.length === 0) return;
    
    let pos = {};
    const radius = 150;
    nodes.forEach((n, i) => {
      // Initialize in a circle
      const angle = (i / nodes.length) * Math.PI * 2;
      pos[n.id] = { 
        x: Math.cos(angle) * radius, 
        y: Math.sin(angle) * radius,
        vx: 0, vy: 0 
      };
      if (n.type === 'incident') {
        pos[n.id] = { x: 0, y: -100, vx: 0, vy: 0 }; // pin incident to top center
      }
    });
    
    let animationFrameId;
    let alpha = 1.0;
    
    const simulate = () => {
      if (alpha < 0.01) return;
      alpha *= 0.95;
      
      const newPos = { ...pos };
      const k = 0.5; // repulsion constant
      const spring = 0.05; // attraction constant
      
      // Repulsion
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const n1 = nodes[i].id;
          const n2 = nodes[j].id;
          const dx = newPos[n1].x - newPos[n2].x;
          const dy = newPos[n1].y - newPos[n2].y;
          let dist = Math.sqrt(dx * dx + dy * dy) || 1;
          
          if (dist < 300) {
            const force = (k * 2000) / (dist * dist);
            const fx = (dx / dist) * force * alpha;
            const fy = (dy / dist) * force * alpha;
            
            newPos[n1].vx += fx;
            newPos[n1].vy += fy;
            newPos[n2].vx -= fx;
            newPos[n2].vy -= fy;
          }
        }
      }
      
      // Attraction
      edges.forEach(e => {
        const n1 = e.source;
        const n2 = e.target;
        if (!newPos[n1] || !newPos[n2]) return;
        
        const dx = newPos[n2].x - newPos[n1].x;
        const dy = newPos[n2].y - newPos[n1].y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const targetDist = 120;
        
        const force = (dist - targetDist) * spring * alpha;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        
        newPos[n1].vx += fx;
        newPos[n1].vy += fy;
        newPos[n2].vx -= fx;
        newPos[n2].vy -= fy;
      });
      
      // Center Gravity
      nodes.forEach(n => {
        newPos[n.id].vx -= (newPos[n.id].x) * 0.01 * alpha;
        newPos[n.id].vy -= (newPos[n.id].y) * 0.01 * alpha;
      });
      
      // Update positions
      nodes.forEach(n => {
        // dampen velocity
        newPos[n.id].vx *= 0.8;
        newPos[n.id].vy *= 0.8;
        
        if (n.type !== 'incident') {
            newPos[n.id].x += newPos[n.id].vx;
            newPos[n.id].y += newPos[n.id].vy;
        }
      });
      
      pos = newPos;
      setPositions({ ...pos });
      
      animationFrameId = requestAnimationFrame(simulate);
    };
    
    simulate();
    
    return () => cancelAnimationFrame(animationFrameId);
  }, [nodes, edges]);

  if (nodes.length <= 1) {
    return (
      <div style={{ background: 'var(--bg-deep)', padding: 32, borderRadius: 8, textAlign: 'center', border: '1px solid rgba(255,255,255,0.08)' }}>
        <Crosshair size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
        <h3 style={{ color: '#fff', fontSize: 16, marginBottom: 8 }}>NO RELATED ENTITIES</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>This incident currently has no correlated events or entities.</p>
      </div>
    );
  }

  // Event Handlers for Panning and Zooming
  const handleWheel = (e) => {
    e.preventDefault();
    const scaleAdjust = e.deltaY > 0 ? 0.9 : 1.1;
    setTransform(prev => ({ ...prev, scale: Math.max(0.2, Math.min(prev.scale * scaleAdjust, 3)) }));
  };

  const handleMouseDown = (e) => {
    if (e.target.tagName !== 'circle' && e.target.tagName !== 'text' && e.target.tagName !== 'image') {
      setIsPanning(true);
      setStartPan({ x: e.clientX - transform.x, y: e.clientY - transform.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isPanning) {
      setTransform(prev => ({ ...prev, x: e.clientX - startPan.x, y: e.clientY - startPan.y }));
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const resetView = () => {
    setTransform({ x: 0, y: 0, scale: 1 });
    setSelectedNode(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
      {/* Campaign Summary */}
      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ flex: 2, background: 'var(--bg-elevated)', padding: 20, borderRadius: 'var(--radius-lg)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize: 11, color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)', fontWeight: 700, marginBottom: 12 }}>
            ATTACK CAMPAIGN DETECTED
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#fff' }}>{incident.evidence?.length || 0}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Related Signals</div>
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#fff' }}>{incident.entities?.length || 0}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Entities</div>
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#fff' }}>{incident.attack_chain?.length || 0}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Attack Stages</div>
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, color: getRiskColor(incident.risk_score) }}>
                {Math.round((incident.risk_score || 0) * 100)}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{incident.risk_level || 'RISK'}</div>
            </div>
          </div>
          {incident.attack_chain?.length > 0 && (
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px dashed rgba(255,255,255,0.1)' }}>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>Primary Chain:</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, fontSize: 12, color: '#fff', fontFamily: 'var(--font-mono)' }}>
                {incident.attack_chain.map((stage, idx) => (
                  <React.Fragment key={stage}>
                    <span style={{ background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: 4 }}>{stage.replace(/_/g, ' ')}</span>
                    {idx < incident.attack_chain.length - 1 && <span style={{ color: 'var(--text-muted)' }}>→</span>}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Risk Drivers */}
        {incident.risk_drivers?.length > 0 && (
          <div style={{ flex: 1, background: 'var(--bg-elevated)', padding: 20, borderRadius: 'var(--radius-lg)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: 11, color: '#f59e0b', fontFamily: 'var(--font-mono)', fontWeight: 700, marginBottom: 12 }}>
              RISK DRIVERS
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 120, overflowY: 'auto' }}>
              {incident.risk_drivers.map((dr, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12 }}>
                  <Zap size={14} color="#f59e0b" style={{ flexShrink: 0, marginTop: 2 }} />
                  <span style={{ color: 'var(--text-secondary)' }}>{dr}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Interactive Graph Area */}
      <div 
        ref={containerRef}
        style={{ 
          flex: 1, 
          minHeight: 400,
          background: '#02040a', 
          borderRadius: 'var(--radius-lg)', 
          border: '1px solid rgba(255,255,255,0.1)',
          position: 'relative',
          overflow: 'hidden',
          cursor: isPanning ? 'grabbing' : 'grab'
        }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 10, display: 'flex', gap: 8 }}>
          <button 
            onClick={resetView}
            style={{ background: 'var(--bg-surface)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '4px 8px', borderRadius: 4, cursor: 'pointer', fontSize: 11 }}
          >
            Reset View
          </button>
        </div>

        <svg width="100%" height="100%">
          <g transform={`translate(${containerRef.current?.clientWidth/2 + transform.x || 300 + transform.x}, ${containerRef.current?.clientHeight/2 + transform.y || 200 + transform.y}) scale(${transform.scale})`}>
            {/* Draw Edges */}
            {edges.map((e, idx) => {
              const p1 = positions[e.source];
              const p2 = positions[e.target];
              if (!p1 || !p2) return null;
              
              const isHovered = hoveredEdge === idx;
              
              return (
                <g key={idx} onMouseEnter={() => setHoveredEdge(idx)} onMouseLeave={() => setHoveredEdge(null)}>
                  <line 
                    x1={p1.x} y1={p1.y} 
                    x2={p2.x} y2={p2.y} 
                    stroke={isHovered ? '#38bdf8' : 'rgba(255,255,255,0.15)'} 
                    strokeWidth={isHovered ? 2 : 1.5}
                  />
                  {isHovered && (
                    <text 
                      x={(p1.x + p2.x)/2} 
                      y={(p1.y + p2.y)/2 - 5} 
                      fill="#38bdf8" 
                      fontSize={10} 
                      textAnchor="middle"
                      fontFamily="var(--font-mono)"
                    >
                      {e.label}
                    </text>
                  )}
                </g>
              );
            })}
            
            {/* Draw Nodes */}
            {nodes.map(n => {
              const pos = positions[n.id];
              if (!pos) return null;
              
              const isSelected = selectedNode?.id === n.id;
              const color = COLOR_MAP[n.type] || COLOR_MAP.default;
              
              return (
                <g 
                  key={n.id} 
                  transform={`translate(${pos.x}, ${pos.y})`}
                  style={{ cursor: 'pointer' }}
                  onClick={(e) => { e.stopPropagation(); setSelectedNode(n); }}
                >
                  <circle 
                    r={isSelected ? 20 : 16} 
                    fill="#05070d" 
                    stroke={color} 
                    strokeWidth={isSelected ? 3 : 2} 
                  />
                  {isSelected && <circle r={24} fill="transparent" stroke={color} strokeWidth={1} strokeDasharray="3 3" />}
                  <text 
                    y={30} 
                    fill={isSelected ? '#fff' : 'var(--text-secondary)'} 
                    fontSize={11} 
                    textAnchor="middle"
                    fontWeight={isSelected ? 700 : 400}
                    fontFamily="var(--font-mono)"
                  >
                    {n.label.length > 20 ? n.label.substring(0, 18) + '...' : n.label}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {/* Selected Node Details Overlay */}
        {selectedNode && (
          <div style={{
            position: 'absolute',
            bottom: 16,
            left: 16,
            width: 320,
            background: 'var(--bg-elevated)',
            border: `1px solid ${COLOR_MAP[selectedNode.type] || COLOR_MAP.default}50`,
            borderRadius: 'var(--radius-md)',
            padding: 16,
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'rgba(255,255,255,0.1)', color: '#fff', textTransform: 'uppercase' }}>
                {selectedNode.type}
              </span>
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 12, wordBreak: 'break-all' }}>
              {selectedNode.label}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
              {Object.entries(selectedNode.data.attributes || {}).map(([k, v]) => (
                <div key={k}>
                  <strong style={{ color: 'var(--text-muted)' }}>{k}:</strong> {JSON.stringify(v)}
                </div>
              ))}
              {selectedNode.data.confidence && (
                <div><strong style={{ color: 'var(--text-muted)' }}>Confidence:</strong> {Math.round(selectedNode.data.confidence * 100)}%</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
