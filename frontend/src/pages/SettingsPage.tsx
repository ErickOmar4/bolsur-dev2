import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Bell, Printer, Building, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const SettingsPage = () => {
  const { user, authFetch, updateUser } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [loadingEmpresa, setLoadingEmpresa] = useState(true);

  // Formulario de Usuario (Perfil)
  const [userForm, setUserForm] = useState({ nombre_completo: "", email: "" });
  
  // Estado granular para los 5 Switches
  const [prefs, setPrefs] = useState({
    notif_pedidos_urgentes: true,
    notif_stock_bajo: true,
    notif_nuevos_pedidos: false,
    imprimir_automatico: false,
    enviar_correo_cliente: true
  });

  // Formulario de Empresa
  const [empresaForm, setEmpresaForm] = useState({
    nombre: "", telefono: "", direccion: "", correo: ""
  });

  // Cargar datos del usuario y sus preferencias al iniciar
  useEffect(() => {
    if (user) {
      setUserForm({
        nombre_completo: user.nombre_completo || "",
        email: user.email || ""
      });
      // Mapear las preferencias desde el objeto user
      setPrefs({
        notif_pedidos_urgentes: !!user.notif_pedidos_urgentes,
        notif_stock_bajo: !!user.notif_stock_bajo,
        notif_nuevos_pedidos: !!user.notif_nuevos_pedidos,
        imprimir_automatico: !!user.imprimir_automatico,
        enviar_correo_cliente: !!user.enviar_correo_cliente,
      });
    }
  }, [user]);

  // Cargar datos de la empresa
  useEffect(() => {
    const cargarDatosEmpresa = async () => {
      try {
        const response = await authFetch("http://localhost:4000/api/empresa");
        if (response.ok) {
          const data = await response.json();
          setEmpresaForm({
            nombre: data.nombre || "",
            telefono: data.telefono || "",
            direccion: data.direccion || "",
            correo: data.correo || ""
          });
        }
      } catch (error) {
        console.error("Error al cargar empresa:", error);
      } finally {
        setLoadingEmpresa(false);
      }
    };
    cargarDatosEmpresa();
  }, [authFetch]);

  // Guardado
  const handleSave = async () => {
    setLoading(true);
    try {
      // Petición 1: Datos de Empresa (PUT)
      const resEmpresa = await authFetch("http://localhost:4000/api/empresa/update", {
        method: "PUT",
        body: JSON.stringify(empresaForm),
      });

      // Petición 2: Perfil + Todas las Preferencias (PATCH)
      const resUser = await authFetch("http://localhost:4000/api/usuarios/preferencias", {
        method: "PATCH",
        body: JSON.stringify({
          ...userForm,
          ...prefs // Enviamos los 5 valores de los switches
        }),
      });

      if (resEmpresa.ok && resUser.ok) {
        // Actualiza el contexto global con la nueva info
        updateUser({ ...userForm, ...prefs });
        toast.success("Configuración actualizada correctamente");
      } else {
        toast.error("Error al guardar algunos cambios");
      }
    } catch (error) {
      toast.error("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  };

  const getRoleName = (rolId: number) => {
    const roles: Record<number, string> = { 1: "Administrador", 2: "Ventas", 3: "Inventario" };
    return roles[rolId] || "Usuario";
  };

  return (
    <AppLayout title="Configuración">
      <div className="space-y-6 max-w-3xl pb-10">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Configuración</h1>
          <p className="text-muted-foreground">Administra la configuración de tu cuenta y sistema</p>
        </div>

        {/* Empresa */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Información de la Empresa</CardTitle>
            </div>
            <CardDescription>Datos que aparecerán en los tickets y reportes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingEmpresa ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Nombre de la empresa</Label>
                    <Input value={empresaForm.nombre} onChange={(e) => setEmpresaForm({...empresaForm, nombre: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Teléfono</Label>
                    <Input value={empresaForm.telefono} onChange={(e) => setEmpresaForm({...empresaForm, telefono: e.target.value})} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Dirección</Label>
                  <Input value={empresaForm.direccion} onChange={(e) => setEmpresaForm({...empresaForm, direccion: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Correo electrónico</Label>
                  <Input type="email" value={empresaForm.correo} onChange={(e) => setEmpresaForm({...empresaForm, correo: e.target.value})} />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Perfil */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Mi Perfil</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Nombre completo</Label>
                <Input value={userForm.nombre_completo} onChange={(e) => setUserForm({...userForm, nombre_completo: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Rol</Label>
                <Input value={getRoleName(user?.rol_id)} disabled className="bg-muted text-muted-foreground" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Correo electrónico (Usuario)</Label>
              <Input type="email" value={userForm.email} onChange={(e) => setUserForm({...userForm, email: e.target.value})} />
            </div>
          </CardContent>
        </Card>

        {/* Notificaciones (3 Switches) */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Notificaciones</CardTitle>
            </div>
            <CardDescription>Configura cuándo recibir alertas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Pedidos urgentes</p>
                <p className="text-sm text-muted-foreground">Alertas cuando un pedido está próximo a vencer</p>
              </div>
              <Switch 
                checked={prefs.notif_pedidos_urgentes} 
                onCheckedChange={(v) => setPrefs({...prefs, notif_pedidos_urgentes: v})} 
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Stock bajo</p>
                <p className="text-sm text-muted-foreground">Alertas cuando un producto alcanza el stock mínimo</p>
              </div>
              <Switch 
                checked={prefs.notif_stock_bajo} 
                onCheckedChange={(v) => setPrefs({...prefs, notif_stock_bajo: v})} 
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Nuevos pedidos</p>
                <p className="text-sm text-muted-foreground">Notificación cuando se crea un nuevo pedido</p>
              </div>
              <Switch 
                checked={prefs.notif_nuevos_pedidos} 
                onCheckedChange={(v) => setPrefs({...prefs, notif_nuevos_pedidos: v})} 
              />
            </div>
          </CardContent>
        </Card>

        {/* Impresión y Correo (2 Switches) */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Printer className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Impresión y Correo</CardTitle>
            </div>
            <CardDescription>Configuración para tickets y envíos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Imprimir automáticamente</p>
                <p className="text-sm text-muted-foreground">Imprimir ticket al crear un pedido</p>
              </div>
              <Switch 
                checked={prefs.imprimir_automatico} 
                onCheckedChange={(v) => setPrefs({...prefs, imprimir_automatico: v})} 
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Enviar copia por correo</p>
                <p className="text-sm text-muted-foreground">Enviar ticket al cliente si tiene correo registrado</p>
              </div>
              <Switch 
                checked={prefs.enviar_correo_cliente} 
                onCheckedChange={(v) => setPrefs({...prefs, enviar_correo_cliente: v})} 
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={loading} className="bg-accent hover:bg-accent/90 text-accent-foreground min-w-[150px]">
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...</> : "Guardar Cambios"}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
};

export default SettingsPage;