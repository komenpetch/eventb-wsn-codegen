import inet.networklayer.base.NetworkProtocolBase;
import inet.networklayer.contract.INetworkProtocol;

//
// Generated network-layer protocol. Protocol-specific parameters are a project
// Phase 4 fill-in.
//
simple MintRoute extends NetworkProtocolBase like INetworkProtocol
{
    parameters:
        @class(MintRoute);
        @display("i=block/fork");
}
