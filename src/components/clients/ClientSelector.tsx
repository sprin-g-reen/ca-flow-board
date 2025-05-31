
import { useState } from 'react';
import { Search, Building2, User, Mail, Phone } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useClients } from '@/hooks/useClients';

interface Client {
  id: string;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  client_code?: string;
  business_type?: string;
  status?: string;
}

interface ClientSelectorProps {
  onClientSelect: (client: Client) => void;
  selectedClientId?: string;
  placeholder?: string;
}

export const ClientSelector = ({ 
  onClientSelect, 
  selectedClientId, 
  placeholder = "Search and select a client..."
}: ClientSelectorProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const { clients, isLoading } = useClients();

  const filteredClients = clients.filter(client =>
    client.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.contact_person?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.client_code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedClient = clients.find(client => client.id === selectedClientId);

  const handleClientSelect = (client: Client) => {
    onClientSelect(client);
    setShowDropdown(false);
    setSearchQuery('');
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder={selectedClient ? selectedClient.name : placeholder}
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          className="pl-10"
        />
      </div>

      {showDropdown && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-96 overflow-auto bg-white border rounded-md shadow-lg">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">Loading clients...</div>
          ) : filteredClients.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              {searchQuery ? 'No clients found' : 'No clients available'}
            </div>
          ) : (
            <div className="p-2">
              {filteredClients.map((client) => (
                <Card
                  key={client.id}
                  className="mb-2 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => handleClientSelect(client)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Building2 className="h-4 w-4 text-gray-400" />
                          <h4 className="font-medium">{client.name}</h4>
                          {client.client_code && (
                            <Badge variant="outline" className="text-xs">
                              {client.client_code}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="space-y-1 text-sm text-gray-600">
                          {client.contact_person && (
                            <div className="flex items-center gap-2">
                              <User className="h-3 w-3" />
                              <span>{client.contact_person}</span>
                            </div>
                          )}
                          
                          {client.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="h-3 w-3" />
                              <span>{client.email}</span>
                            </div>
                          )}
                          
                          {client.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-3 w-3" />
                              <span>{client.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-1">
                        <Badge 
                          className={
                            client.status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }
                        >
                          {client.status}
                        </Badge>
                        {client.business_type && (
                          <span className="text-xs text-gray-400">
                            {client.business_type}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Overlay to close dropdown */}
      {showDropdown && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
};
