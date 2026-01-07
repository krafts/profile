# Deprecated since starship v1.17.0, https://github.com/starship/starship/pull/4550
# NO Longer needed as [[kubernetes.contexts]] are now used, tested in starship v1.18.2

kube_current_context="$(kubectl config current-context)"
star_config_file="${HOME}/.config/starship/starship.toml"

# set starship config
case "${kube_current_context}" in
  dev-* | *111111111111*)
    ln -sf ${HOME}/.config/starship/starship.k8s.dev.toml ${star_config_file}
    ;;
  qat-* | *222222222222* | *444444444444* | *666666666666:cluster/qat*)
    ln -sf ${HOME}/.config/starship/starship.k8s.qat.toml ${star_config_file}
    ;;
  prod-* | *333333333333* | *555555555555* | *666666666666:cluster/production* | *cluster-a* | *cluster-b*)
    ln -sf ${HOME}/.config/starship/starship.k8s.prd.toml ${star_config_file}
    ;;
  *)
    ln -sf ${HOME}/.config/starship/starship.default.toml ${star_config_file}
    ;;
esac
