 /// <reference path="meteor.d.ts" />
 

declare module UltiSite {
	var adminNotifications: Mongo.Collection<any>;
	var Blogs: Mongo.Collection<any>;
	var Cities: Mongo.Collection<any>;
	var ContentVersions: Mongo.Collection<any>;
	var Countries: Mongo.Collection<any>;
	var Documents: Mongo.Collection<any>;
	var Events: Mongo.Collection<any>;
	var Ffindr: Mongo.Collection<any>;
	var Folders: Mongo.Collection<any>;
	var Images: Mongo.Collection<any>;
	var LookupId: Mongo.Collection<any>;
	var Participants: Mongo.Collection<any>;
	var Practices: Mongo.Collection<any>;
	var Settings: Mongo.Collection<any>;
	var Statistics: Mongo.Collection<any>;
	var Teams: Mongo.Collection<any>;
	var Tournaments: Mongo.Collection<any>;
	var Tweets: Mongo.Collection<any>;
	var WikiPages: Mongo.Collection<any>;
	function addOpenLayers ();
	var blogsReady: ReactiveVar<boolean>;
	function currentClub(con);
	function fileBrowserHideDialog();
	function fileBrowserShowDialog(id, callback);
	function fileRootFolder():any;
	var filesReady: ReactiveVar<boolean>;
	function getAlias (aliase, con);
	function getAnyById (ids);
	var initialSubsReady: ReactiveVar<boolean>;
	function isAdmin(userid, con);
	var myTeamIds: ReactiveVar<[string]>;
	var schemas: Object
	function search (term, type);
	function subscribeBlogs (id)
	function subscribeFiles (id)
	function subscribeTournament (id)
	function subscribeUser (id)
	function subscribeWikiPage (id)
	var subscribedBlogs: ReactiveVar<[string]>;
	var subscribedFiles: ReactiveVar<[string]>;
	var subscribedPages: ReactiveVar<[string]>;
	var subscribedTournaments: ReactiveVar<[string]>;
	var subscribedUsers: ReactiveVar<[string]>;
	function textState (state)
	function toggleSidebar (override)
	var tournamentsReady: ReactiveVar<boolean>;
	function userByAlias (alias, con)
	var usersReady: ReactiveVar<boolean>;
	var wikiPagesReady: ReactiveVar<boolean>;
}