import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Handshake, ArrowRight, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SettlementRecommendations() {
  const { data: settlements, isLoading } = useQuery({
    queryKey: ["/api/settlements"],
    queryFn: () => api.getSettlements(),
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center">
            <Handshake className="text-primary mr-2 h-5 w-5" />
            Settlement Recommendations
          </h3>
          <p className="text-sm text-gray-600 mt-1">Optimized to minimize transactions</p>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-gray-50 border border-gray-200 animate-pulse">
                <div className="flex items-center flex-1">
                  <div className="w-10 h-10 bg-gray-200 rounded-full mr-4"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
                <div className="h-6 bg-gray-200 rounded w-16"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-xl font-semibold text-gray-900 flex items-center">
          <Handshake className="text-primary mr-2 h-5 w-5" />
          Settlement Recommendations
        </h3>
        <p className="text-sm text-gray-600 mt-1">Optimized to minimize transactions</p>
      </div>

      <div className="p-6">
        {settlements && settlements.length > 0 ? (
          <div className="space-y-4">
            {settlements.map((settlement, index) => (
              <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-gray-50 border border-gray-200">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-error/10 rounded-full flex items-center justify-center mr-4">
                    <ArrowRight className="h-4 w-4 text-error" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      <span className="font-semibold">{settlement.from}</span> owes{" "}
                      <span className="font-semibold">{settlement.to}</span>
                    </p>
                    <p className="text-sm text-gray-600">Settlement transaction</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-error">₹{settlement.amount}</p>
                  <Button
                    variant="link"
                    className="text-xs text-primary hover:text-blue-700 font-medium mt-1 p-0"
                    disabled
                  >
                    Mark as Paid
                  </Button>
                </div>
              </div>
            ))}

            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 flex items-center justify-center">
                <Info className="h-4 w-4 mr-1" />
                {settlements.length} transaction{settlements.length !== 1 ? 's' : ''} needed to settle all balances
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            <p>No settlements needed. All balances are settled!</p>
          </div>
        )}
      </div>
    </div>
  );
}
