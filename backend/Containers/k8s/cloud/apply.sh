kubectl apply -f aws-cognito-secrets.yaml

kubectl apply -f authentication-deployment.yaml
kubectl apply -f invoice-deployment.yaml
# kubectl apply -f user-deployment.yaml
kubectl apply -f timetable-deployment.yaml
kubectl apply -f database-deployment.yaml

kubectl apply -f api-service.yaml