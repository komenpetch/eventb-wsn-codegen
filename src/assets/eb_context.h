#pragma once
#include <map>
#include <set>

// Element aliases (ENC1: every Event-B element is an int label).
using Node  = int;
using PktId = int;
using Data  = int;

// Context constants referenced by the generated machine code but defined here
// (the tool is machine-only; these stand in for the cM1/cM2 context mapping).
inline std::set<int> ND, Dests;                         // ND, Dests ⊆ ℕ
inline std::map<int, int> initialSrcAddr;               // PKT → ND
inline std::map<int, int> finalDestAddr;                // PKT → ND  (singleton range)
inline std::map<int, int> type;                         // PKT → TYPE
inline const int DATA = 0;                              // a TYPE element
inline std::set<int> CONTROL;                           // a subset of TYPE
inline const int CTL_VAL = 0;                              // a ℤ constant
inline constexpr bool FALSE = false, TRUE = true;       // BOOL constants
