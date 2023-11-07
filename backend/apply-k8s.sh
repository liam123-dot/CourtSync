kubectl apply -f Containers/k8s/aws-cognito-secrets.yaml
kubectl apply -f Containers/k8s/auth-deployment.yaml
kubectl apply -f Containers/k8s/db-deployment.yaml
kubectl apply -f Containers/k8s/timetable-deployment.yaml
kubectl apply -f Containers/k8s/invoice-deployment.yaml
kubectl apply -f Containers/k8s/api-service.yaml