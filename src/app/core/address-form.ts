export interface AddressFormValue {
  postalCode: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
}

export function emptyAddressFormValue(): AddressFormValue {
  return {
    postalCode: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: ''
  };
}

const LABEL_MAP: Record<string, keyof AddressFormValue> = {
  cep: 'postalCode',
  rua: 'street',
  endereco: 'street',
  endereço: 'street',
  numero: 'number',
  número: 'number',
  complemento: 'complement',
  bairro: 'neighborhood',
  cidade: 'city',
  estado: 'state',
  uf: 'state'
};

function normalizeLabel(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

export function parseAddress(address: string | null | undefined): AddressFormValue {
  const initial = emptyAddressFormValue();
  if (!address?.trim()) {
    return initial;
  }

  const parsed = address
    .split('|')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .reduce<AddressFormValue>((result, entry) => {
      const [rawLabel, ...rest] = entry.split(':');
      if (!rawLabel || !rest.length) {
        return result;
      }

      const field = LABEL_MAP[normalizeLabel(rawLabel)];
      if (!field) {
        return result;
      }

      result[field] = rest.join(':').trim();
      return result;
    }, emptyAddressFormValue());

  const hasStructuredValue = Object.values(parsed).some((value) => value.length > 0);
  if (hasStructuredValue) {
    return parsed;
  }

  return {
    ...initial,
    street: address.trim()
  };
}

export function composeAddress(address: AddressFormValue): string | null {
  const parts = [
    ['CEP', address.postalCode],
    ['Rua', address.street],
    ['Numero', address.number],
    ['Complemento', address.complement],
    ['Bairro', address.neighborhood],
    ['Cidade', address.city],
    ['Estado', address.state]
  ]
    .map(([label, value]) => [label, value.trim()] as const)
    .filter(([, value]) => value.length > 0)
    .map(([label, value]) => `${label}: ${value}`);

  return parts.length ? parts.join(' | ') : null;
}
