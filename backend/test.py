import stripe

stripe.api_key='sk_test_51O9ZfgHr5w2HXr5R8PQcEotoZ5FacJdXCm4yrAjWwjiFI9MkOwnqQLi6P2BBwYlrO5IeOZ7LznSW1oOBFdrV1Fci002J5POU5f'

invoice = stripe.Invoice.retrieve(
    'in_1OCoZnLoHbU1vYPaL1Kn5PaO',
    stripe_account='acct_1OCoQWLoHbU1vYPa'
)
print(invoice)