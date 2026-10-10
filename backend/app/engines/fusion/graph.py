"""In-Memory Bounded Evidence Relationship Graph for ORION v2.

Maintains normalized relationships between Entities, Evidence Items, and Incidents.
Enforces cycle prevention and bounded graph traversal for deterministic safety.
"""

from collections import deque
from enum import Enum
from typing import Any, Dict, List, Optional, Set, Tuple
from pydantic import BaseModel, ConfigDict, Field

from app.schemas.evidence import EvidenceItem
from app.engines.fusion.entity import CanonicalEntity


class GraphRelation(str, Enum):
    """Canonical edge relationship types between security graph nodes."""
    OBSERVED_ON = "OBSERVED_ON"
    CONTAINS = "CONTAINS"
    CLAIMS = "CLAIMS"
    RELATED_TO = "RELATED_TO"
    DERIVED_FROM = "DERIVED_FROM"
    MATCHES = "MATCHES"
    OCCURRED_NEAR = "OCCURRED_NEAR"
    TARGETS = "TARGETS"
    ASSOCIATED_WITH = "ASSOCIATED_WITH"


class GraphEdge(BaseModel):
    """Directed edge in the Evidence Relationship Graph."""
    source_id: str
    target_id: str
    relation: GraphRelation
    attributes: Dict[str, Any] = Field(default_factory=dict)

    model_config = ConfigDict(use_enum_values=True)


class EvidenceGraph:
    """Lightweight, in-memory, bounded security graph for multimodal correlation."""

    def __init__(self, max_nodes: int = 500, max_traversal_depth: int = 4):
        self.max_nodes = max_nodes
        self.max_traversal_depth = max_traversal_depth
        self.entities: Dict[str, CanonicalEntity] = {}
        self.evidence: Dict[str, EvidenceItem] = {}
        self.adj_list: Dict[str, List[GraphEdge]] = {}
        self.reverse_adj: Dict[str, List[GraphEdge]] = {}

    def add_entity(self, entity: CanonicalEntity) -> None:
        """Register a canonical entity node."""
        if len(self.entities) + len(self.evidence) >= self.max_nodes:
            return
        self.entities[entity.id] = entity
        if entity.id not in self.adj_list:
            self.adj_list[entity.id] = []
        if entity.id not in self.reverse_adj:
            self.reverse_adj[entity.id] = []

    def add_evidence(self, item: EvidenceItem) -> None:
        """Register an evidence item node and auto-link to referenced entities."""
        if len(self.entities) + len(self.evidence) >= self.max_nodes:
            return
        self.evidence[item.id] = item
        if item.id not in self.adj_list:
            self.adj_list[item.id] = []
        if item.id not in self.reverse_adj:
            self.reverse_adj[item.id] = []

        # Auto-link to referenced entities
        for ent_id in item.entity_refs:
            self.add_edge(item.id, ent_id, GraphRelation.OBSERVED_ON)

    def add_edge(
        self,
        source_id: str,
        target_id: str,
        relation: GraphRelation,
        attributes: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Add a directed relationship edge."""
        if source_id not in self.adj_list:
            self.adj_list[source_id] = []
        if target_id not in self.reverse_adj:
            self.reverse_adj[target_id] = []

        # Avoid duplicate edges with same source, target, and relation
        for edge in self.adj_list[source_id]:
            if edge.target_id == target_id and edge.relation == relation:
                return

        edge = GraphEdge(
            source_id=source_id,
            target_id=target_id,
            relation=relation,
            attributes=attributes or {},
        )
        self.adj_list[source_id].append(edge)
        self.reverse_adj[target_id].append(edge)

    def get_neighbors(self, node_id: str) -> List[Tuple[str, GraphRelation]]:
        """Get direct neighbor nodes and edge types in both forward and reverse directions."""
        neighbors: List[Tuple[str, GraphRelation]] = []
        if node_id in self.adj_list:
            for e in self.adj_list[node_id]:
                neighbors.append((e.target_id, e.relation))
        if node_id in self.reverse_adj:
            for e in self.reverse_adj[node_id]:
                neighbors.append((e.source_id, e.relation))
        return neighbors

    def traverse(
        self,
        start_id: str,
        max_depth: Optional[int] = None,
    ) -> Dict[str, Any]:
        """Bounded BFS traversal to collect connected subgraph with cycle protection."""
        depth_limit = max_depth if max_depth is not None else self.max_traversal_depth
        visited_nodes: Set[str] = {start_id}
        collected_entities: List[Dict[str, Any]] = []
        collected_evidence: List[Dict[str, Any]] = []
        collected_edges: List[Dict[str, Any]] = []

        queue: deque = deque([(start_id, 0)])

        while queue:
            curr_id, curr_depth = queue.popleft()

            if curr_id in self.entities:
                collected_entities.append(self.entities[curr_id].model_dump())
            elif curr_id in self.evidence:
                collected_evidence.append(self.evidence[curr_id].model_dump(mode="json"))

            if curr_depth >= depth_limit:
                continue

            # Forward edges
            for edge in self.adj_list.get(curr_id, []):
                collected_edges.append(edge.model_dump())
                nxt = edge.target_id
                if nxt not in visited_nodes and len(visited_nodes) < self.max_nodes:
                    visited_nodes.add(nxt)
                    queue.append((nxt, curr_depth + 1))

            # Reverse edges
            for edge in self.reverse_adj.get(curr_id, []):
                collected_edges.append(edge.model_dump())
                nxt = edge.source_id
                if nxt not in visited_nodes and len(visited_nodes) < self.max_nodes:
                    visited_nodes.add(nxt)
                    queue.append((nxt, curr_depth + 1))

        return {
            "root_id": start_id,
            "depth_reached": depth_limit,
            "entities": collected_entities,
            "evidence": collected_evidence,
            "edges": collected_edges,
        }

    def find_cross_modal_chains(self) -> List[Dict[str, Any]]:
        """Identify canonical attack chains and multimodal correlation paths in the graph."""
        chains: List[Dict[str, Any]] = []

        # Chain Pattern 1: Phishing Message -> URL -> Domain
        for ent_id, ent in self.entities.items():
            if ent.type == "url":
                # Check if URL is contained in a message or linked to evidence
                related_edges = self.reverse_adj.get(ent_id, [])
                for edge in related_edges:
                    if edge.relation in (GraphRelation.CONTAINS, GraphRelation.OBSERVED_ON):
                        chains.append({
                            "type": "phishing_link_chain",
                            "start": edge.source_id,
                            "url": ent.canonical_value,
                            "relation": edge.relation,
                        })

        # Chain Pattern 2: Media -> Face / Voice -> Person
        for ent_id, ent in self.entities.items():
            if ent.type == "person":
                matching_edges = self.reverse_adj.get(ent_id, [])
                for edge in matching_edges:
                    if edge.relation == GraphRelation.MATCHES:
                        chains.append({
                            "type": "identity_impersonation_chain",
                            "target_person": ent.canonical_value,
                            "media_source": edge.source_id,
                        })

        return chains
