import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Scale, User } from "lucide-react";

export function BalanceSummary() {
  const { data: balances, isLoading } = useQuery({
    queryKey: ["/api/balances"],
    queryFn: () => api.getBalances(),
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center">
            <Scale className="text-primary mr-2 h-5 w-5" />
            Balance Summary
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="text-center p-4 rounded-lg border border-gray-200 animate-pulse">
                <div className="w-12 h-12 bg-gray-200 rounded-full mx-auto mb-3"></div>
                <div className="h-4 bg-gray-200 rounded mb-1"></div>
                <div className="h-6 bg-gray-200 rounded"></div>
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
          <Scale className="text-primary mr-2 h-5 w-5" />
          Balance Summary
        </h3>
      </div>

      <div className="p-6">
        {balances && balances.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {balances.map((person) => (
              <div key={person.name} className="text-center p-4 rounded-lg border border-gray-200">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <User className="h-6 w-6 text-gray-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">{person.name}</h4>
                <p className={`text-sm font-medium ${
                  person.balance > 0 ? 'text-success' :
                  person.balance < 0 ? 'text-error' : 'text-gray-600'
                }`}>
                  {person.balance > 0 ? '+' : ''}₹{Math.abs(person.balance)}
                </p>
                <p className="text-xs text-gray-500">
                  {person.balance > 0 ? 'Gets back' :
                   person.balance < 0 ? 'Owes' : 'Settled'}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            <p>No balances to show. Add some expenses to see balance summary.</p>
          </div>
        )}
      </div>
    </div>
  );
}
