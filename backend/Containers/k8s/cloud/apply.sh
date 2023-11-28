# helm upgrade -i aws-load-balancer-controller eks/aws-load-balancer-controller -n kube-system --set clusterName=extravagant-painting-1700408444 --set serviceAccount.create=false --set serviceAccount.name=aws-load-balancer-controller --set region=eu-west-2

kubectl apply -f aws-cognito-secrets.yaml
kubectl apply -f database-secrets-test.yaml

kubectl apply -f authentication-deployment.yaml
kubectl apply -f invoice-deployment.yaml
# kubectl apply -f user-deployment.yaml
kubectl apply -f timetable-deployment.yaml
kubectl apply -f database-deployment.yaml

kubectl apply -f api-service.yaml