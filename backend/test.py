import stripe

stripe.api_key = "sk_test_51O9ZfgHr5w2HXr5R8PQcEotoZ5FacJdXCm4yrAjWwjiFI9MkOwnqQLi6P2BBwYlrO5IeOZ7LznSW1oOBFdrV1Fci002J5POU5f"

account = stripe.Account.retrieve(
    'acct_1OCsWgQd6CaP9INW'
    
    )

print(account)