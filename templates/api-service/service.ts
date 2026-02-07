import api from './api';
import { AxiosResponse } from 'axios';

// Define types
export interface { { Entity } } {
    id: string;
    // other fields
}

export const {{ Entity }}Service = {
    getAll: async (): Promise<{{ Entity }
}[] > => {
    const response: AxiosResponse<{{ Entity }
} [] > = await api.get('/{{endpoint}}');
return response.data;
  },

getById: async (id: string): Promise<{{ Entity }}> => {
    const response: AxiosResponse<{{ Entity }
}> = await api.get(`/{{endpoint}}/${id}`);
return response.data;
  },

create: async (data: Omit<{{ Entity }}, 'id'>): Promise < {{ Entity }}> => {
    const response: AxiosResponse<{{ Entity }
}> = await api.post('/{{endpoint}}', data);
return response.data;
  },

update: async (id: string, data: Partial<{{ Entity }}>) => {
    const response: AxiosResponse<{{ Entity }
}> = await api.put(`/{{endpoint}}/${id}`, data);
return response.data;
  },

delete: async (id: string): Promise<void> => {
    await api.delete(`/{{endpoint}}/${id}`);
}
};
