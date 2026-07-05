#pragma once
#include <map>
#include <set>

// Element aliases (ENC1: every Event-B element is an int label).
using Node  = int;
using PktId = int;
using Data  = int;

// Context constants referenced by the generated machine code but defined here
// (the tool is machine-only; this stub stands in for the cM1/cM2 contexts).
//
// ⚠ The four maps/sets below start EMPTY. The simulation harness must populate
// ND, Dests, type, initialSrcAddr, and finalDestAddr before any generated
// event method runs — `type.at(pkt)` etc. throw std::out_of_range otherwise.
inline std::set<int> ND, Dests;                    // ND, Dests ⊆ ℕ (harness)
inline std::map<int, int> initialSrcAddr;          // PKT → ND (harness)
inline std::map<int, int> finalDestAddr;           // PKT → ND, singleton range (harness)
inline std::map<int, int> type;                    // PKT → TYPE (harness)

// TYPE per cM2 axm2_3: partition(TYPE, CONTROL, {DATA}) — CONTROL is nonempty
// and disjoint from {DATA}, so the two packet kinds are distinguishable.
inline const int DATA = 0;                         // the TYPE element for data packets
inline std::set<int> CONTROL = {1};                // the control TYPE elements
inline const int CTL_VAL = 0;                      // cM2 axm2_5: CTL_VAL = 0 (a ℤ data value)
inline constexpr bool FALSE = false, TRUE = true;  // BOOL constants
