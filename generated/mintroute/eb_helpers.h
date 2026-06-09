#pragma once
// eb_helpers.h — templated helper library for Event-B → C++ generated code.
// Helper set transcribed from design/translation_rules_examples.md v3.1
// §"Helper Functions Required". The CommPattern canonical names
// (domRestrictedRange, tupleApply, relationalImage, routeNodeAt, routeLength)
// are the emission names; the eb_* names are documentation aliases.
#include <map>
#include <set>
#include <utility>

// ─── Constant-function accessors ───────────────────────────────────────────
// The Event-B constant function `type ∈ PKT → TYPE` has no machine-variable
// storage, so rule R1 (type(x) ∈ S) needs a free accessor. Packet type is held
// in this registry; project Phase 4 populates it when packets are constructed.
inline std::map<int, int>& ebPacketTypes() { static std::map<int, int> t; return t; }
inline int getType(int pkt) {                                            // R1
  auto it = ebPacketTypes().find(pkt);
  return it != ebPacketTypes().end() ? it->second : -1;
}

// ─── Function-form helpers (std::map<K, V>) ────────────────────────────────
template <typename K, typename V>
bool eb_in_range(const std::map<K, V>& R, const V& x) {                  // A3
  for (const auto& kv : R) if (kv.second == x) return true;
  return false;
}

template <typename K, typename V>
std::map<K, V> eb_dom_restrict(const std::set<K>& D,
                               const std::map<K, V>& R) {                // R5
  std::map<K, V> out;
  for (const auto& kv : R) if (D.count(kv.first)) out.insert(kv);
  return out;
}

template <typename K, typename V>
std::map<K, V> eb_dom_restrict_single(const K& k,
                                      const std::map<K, V>& R) {         // R5
  std::map<K, V> out;
  auto it = R.find(k);
  if (it != R.end()) out.insert(*it);
  return out;
}

template <typename K, typename V>
std::set<V> eb_rel_image(const std::map<K, V>& R,
                         const std::set<K>& S) {                        // R7
  std::set<V> out;
  for (const auto& k : S) { auto it = R.find(k); if (it != R.end()) out.insert(it->second); }
  return out;
}

template <typename K, typename V>
std::set<V> eb_rel_image_single(const std::map<K, V>& R, const K& x) {   // R7
  std::set<V> out;
  auto it = R.find(x);
  if (it != R.end()) out.insert(it->second);
  return out;
}

template <typename K, typename V>
std::map<K, V> eb_range_anti_restrict(const std::map<K, V>& R,
                                      const std::set<V>& excluded) {     // R8
  std::map<K, V> out;
  for (const auto& kv : R) if (!excluded.count(kv.second)) out.insert(kv);
  return out;
}

template <typename K, typename V>
bool eb_in_range_union(const std::map<K, V>& R,
                       const std::map<K, V>& S, const V& x) {            // R10
  for (const auto& kv : R) if (kv.second == x) return true;
  for (const auto& kv : S) if (kv.second == x) return true;
  return false;
}

template <typename K, typename V>
bool eb_in_range_union3(const std::map<K, V>& R, const std::map<K, V>& S,
                        const std::map<K, V>& T, const V& x) {           // R10
  return eb_in_range_union(R, S, x) || eb_in_range(T, x);
}

// ─── Map-of-sets helpers (std::map<A, std::set<B>>) ────────────────────────
template <typename A, typename B>
bool eb_in_range_rel(const std::map<A, std::set<B>>& R, const B& x) {    // A3
  for (const auto& kv : R) if (kv.second.count(x)) return true;
  return false;
}

template <typename A, typename B>
std::set<B> eb_ran_dom_restrict_rel_single(const A& k,
                                           const std::map<A, std::set<B>>& R) {  // R7
  auto it = R.find(k);
  return it != R.end() ? it->second : std::set<B>{};
}

template <typename A, typename B>
std::set<B> relationalImage(const std::map<A, std::set<B>>& R, const A& k) {     // R7 (canonical)
  auto it = R.find(k);
  return it != R.end() ? it->second : std::set<B>{};
}

// ─── Pair-set helpers (std::set<std::pair<A, B>>) ──────────────────────────
template <typename A, typename B>
bool eb_in_dom_pairset(const std::set<std::pair<A, B>>& R, const A& x) {         // R2
  for (const auto& p : R) if (p.first == x) return true;
  return false;
}

template <typename A, typename B>
bool eb_in_range_pairset(const std::set<std::pair<A, B>>& R, const B& x) {       // A3
  for (const auto& p : R) if (p.second == x) return true;
  return false;
}

template <typename A, typename B>
bool eb_in_dom_union_pairset(const std::set<std::pair<A, B>>& R,
                             const std::set<std::pair<A, B>>& S, const A& x) {    // R12
  for (const auto& p : R) if (p.first == x) return true;
  for (const auto& p : S) if (p.first == x) return true;
  return false;
}

template <typename A, typename B>
bool eb_in_range_union_pairset(const std::set<std::pair<A, B>>& R,
                               const std::set<std::pair<A, B>>& S, const B& x) {  // R10
  for (const auto& p : R) if (p.second == x) return true;
  for (const auto& p : S) if (p.second == x) return true;
  return false;
}

// Range-over-union membership (R10), pair-set form (matches RULES R10 emission)
template <typename A, typename B>
bool eb_in_range_union(const std::set<std::pair<A, B>>& R,
                       const std::set<std::pair<A, B>>& S, const B& x) {          // R10
  for (const auto& p : R) if (p.second == x) return true;
  for (const auto& p : S) if (p.second == x) return true;
  return false;
}

template <typename A, typename B>
void eb_range_anti_restrict_pairset(std::set<std::pair<A, B>>& R,
                                    const std::set<B>& excluded) {                // R8
  for (auto it = R.begin(); it != R.end();) {
    if (excluded.count(it->second)) it = R.erase(it);
    else ++it;
  }
}

// ─── PairRouteTable helpers (CommPattern canonical names) ──────────────────
// Pair-keyed domain-restricted range (R17 / Form A)
template <typename X, typename S, typename V>
std::set<S> domRestrictedRange(const std::map<std::pair<X, S>, V>& R, const X& x) {
  std::set<S> out;
  for (const auto& kv : R) if (kv.first.first == x) out.insert(kv.first.second);
  return out;
}

// Pair-keyed function application (R18 / Form B)
template <typename X, typename S, typename V>
V tupleApply(const std::map<std::pair<X, S>, V>& R, const X& x, const S& s) {
  return R.at({x, s});
}

// ─── SourceRouteCache helpers (DSR-only, flat encoding dsrPath ∈ (PKT×ℕ)→ND) ─
inline int routeNodeAt(const std::map<std::pair<int, int>, int>& dsrPath, int pkt, int idx) {  // R19
  return dsrPath.at({pkt, idx});
}

inline int routeLength(const std::map<std::pair<int, int>, int>& dsrPath, int pkt) {           // R20
  int n = 0;
  for (const auto& kv : dsrPath) if (kv.first.first == pkt) ++n;
  return n;
}
