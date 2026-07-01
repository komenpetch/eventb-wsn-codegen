#pragma once
#include <algorithm>
#include "eb_context.h"

// Pair-set domain / range membership (a relation keeps no separate key index).
template<class R> bool inDom(const R& r, Node x) {
  return std::any_of(r.begin(), r.end(), [&](const auto& p){ return p.first == x; });
}
template<class R> bool inRan(const R& r, PktId y) {
  return std::any_of(r.begin(), r.end(), [&](const auto& p){ return p.second == y; });
}
