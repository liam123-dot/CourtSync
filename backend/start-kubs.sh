minikube delete
minikube start
helm install nginx-ingress ingress-nginx/ingress-nginx

kubectl apply -f Containers/k8s/local/aws-cognito-secrets.yaml
kubectl apply -f Containers/k8s/local/stripe-secrets.yaml
kubectl apply -f Containers/k8s/local/database-secrets-test.yaml
kubectl apply -f Containers/k8s/local/authentication-deployment.yaml
kubectl apply -f Containers/k8s/local/database-deployment.yaml
kubectl apply -f Containers/k8s/local/timetable-deployment.yaml
kubectl apply -f Containers/k8s/local/invoice-deployment.yaml
kubectl apply -f Containers/k8s/local/user-deployment.yaml
# kubectl apply -f Containers/k8s/api-service.yaml
